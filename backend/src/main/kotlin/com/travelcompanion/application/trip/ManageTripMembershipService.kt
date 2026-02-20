package com.travelcompanion.application.trip

import com.travelcompanion.application.AccessResult
import com.travelcompanion.domain.trip.InviteStatus
import com.travelcompanion.domain.trip.Trip
import com.travelcompanion.domain.trip.TripId
import com.travelcompanion.domain.trip.TripInvite
import com.travelcompanion.domain.trip.TripMembership
import com.travelcompanion.domain.trip.TripRepository
import com.travelcompanion.domain.trip.TripRole
import com.travelcompanion.domain.user.UserId
import com.travelcompanion.domain.user.UserRepository
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class ManageTripMembershipService(
    private val tripRepository: TripRepository,
    private val userRepository: UserRepository,
) {

    fun addOwner(tripId: TripId, actorUserId: UserId, targetUserId: UserId): AccessResult<Trip> {
        val trip = tripRepository.findById(tripId) ?: return AccessResult.NotFound
        if (!trip.hasRole(actorUserId, TripRole.OWNER)) return AccessResult.Forbidden
        val updated = trip.addOwner(actorUserId, targetUserId)
        return AccessResult.Success(tripRepository.save(updated))
    }

    fun removeMember(tripId: TripId, actorUserId: UserId, targetUserId: UserId): AccessResult<Trip> {
        val trip = tripRepository.findById(tripId) ?: return AccessResult.NotFound
        if (!trip.hasRole(actorUserId, TripRole.OWNER)) return AccessResult.Forbidden
        val updated = trip.removeMember(actorUserId, targetUserId)
        return AccessResult.Success(tripRepository.save(updated))
    }

    fun leaveTrip(
        tripId: TripId,
        memberUserId: UserId,
        successorOwnerUserId: UserId? = null,
    ): AccessResult<Trip> {
        val trip = tripRepository.findById(tripId) ?: return AccessResult.NotFound
        if (!trip.isMember(memberUserId)) return AccessResult.Forbidden
        val updated = trip.leaveTrip(memberUserId, successorOwnerUserId)
        return AccessResult.Success(tripRepository.save(updated))
    }

    fun inviteMember(tripId: TripId, actorUserId: UserId, email: String, role: TripRole): AccessResult<Trip> {
        val trip = tripRepository.findById(tripId) ?: return AccessResult.NotFound
        if (!trip.hasRole(actorUserId, TripRole.OWNER)) return AccessResult.Forbidden

        val normalizedEmail = normalizeEmail(email)
        val existingUser = userRepository.findByEmail(normalizedEmail)
        if (existingUser != null) {
            val existingMembership = trip.memberships.firstOrNull { it.userId == existingUser.id }
            if (existingMembership?.role == TripRole.OWNER && role != TripRole.OWNER) {
                if (existingUser.id != actorUserId) {
                    throw IllegalArgumentException("Owners cannot change other owners roles")
                }
                val remainingOwners = trip.memberships.count {
                    it.role == TripRole.OWNER && it.userId != existingUser.id
                }
                if (remainingOwners == 0) {
                    throw IllegalArgumentException("Trip must have at least one owner")
                }
            }
            val updatedMemberships = upsertMembershipRole(trip.memberships, existingUser.id, role)
            val updatedInvites = trip.invites.map { invite ->
                if (invite.email.equals(normalizedEmail, ignoreCase = true)) {
                    invite.copy(status = InviteStatus.REVOKED)
                } else {
                    invite
                }
            }
            return AccessResult.Success(
                tripRepository.save(trip.copy(memberships = updatedMemberships, invites = updatedInvites))
            )
        }

        val now = Instant.now()
        val existingInviteIndex = trip.invites.indexOfFirst { it.email.equals(normalizedEmail, ignoreCase = true) }
        val updatedInvites = trip.invites.toMutableList()
        if (existingInviteIndex >= 0) {
            val existing = updatedInvites[existingInviteIndex]
            updatedInvites[existingInviteIndex] = existing.copy(
                email = normalizedEmail,
                role = role,
                status = InviteStatus.PENDING,
                createdAt = now,
            )
        } else {
            updatedInvites += TripInvite(
                email = normalizedEmail,
                role = role,
                status = InviteStatus.PENDING,
                createdAt = now,
            )
        }

        return AccessResult.Success(tripRepository.save(trip.copy(invites = updatedInvites)))
    }

    fun respondToInvite(tripId: TripId, userId: UserId, accept: Boolean): AccessResult<Trip> {
        val trip = tripRepository.findById(tripId) ?: return AccessResult.NotFound
        val user = userRepository.findById(userId) ?: return AccessResult.NotFound
        val normalizedEmail = normalizeEmail(user.email)

        val inviteIndex = trip.invites.indexOfFirst {
            it.email.equals(normalizedEmail, ignoreCase = true) && it.status == InviteStatus.PENDING
        }
        if (inviteIndex < 0) return AccessResult.Forbidden

        val invite = trip.invites[inviteIndex]
        val updatedInvites = trip.invites.toMutableList()
        updatedInvites[inviteIndex] = invite.copy(status = if (accept) InviteStatus.ACCEPTED else InviteStatus.DECLINED)

        val updatedMemberships = if (accept) {
            upsertMembershipRole(trip.memberships, userId, invite.role)
        } else {
            trip.memberships
        }

        return AccessResult.Success(tripRepository.save(trip.copy(invites = updatedInvites, memberships = updatedMemberships)))
    }

    fun removePendingOrDeclinedInvite(tripId: TripId, actorUserId: UserId, email: String): AccessResult<Trip> {
        val trip = tripRepository.findById(tripId) ?: return AccessResult.NotFound
        if (!trip.hasRole(actorUserId, TripRole.OWNER)) return AccessResult.Forbidden

        val normalizedEmail = normalizeEmail(email)
        val updatedInvites = trip.invites.filterNot {
            it.email.equals(normalizedEmail, ignoreCase = true) &&
                (it.status == InviteStatus.PENDING || it.status == InviteStatus.DECLINED)
        }
        return AccessResult.Success(tripRepository.save(trip.copy(invites = updatedInvites)))
    }

    fun changeMemberRole(tripId: TripId, actorUserId: UserId, targetUserId: UserId, role: TripRole): AccessResult<Trip> {
        val trip = tripRepository.findById(tripId) ?: return AccessResult.NotFound
        if (!trip.hasRole(actorUserId, TripRole.OWNER)) return AccessResult.Forbidden

        val targetMembership = trip.memberships.firstOrNull { it.userId == targetUserId }
            ?: throw IllegalArgumentException("Target user is not a member")
        if (targetMembership.role == TripRole.OWNER && targetUserId != actorUserId) {
            throw IllegalArgumentException("Owners cannot change other owners roles")
        }
        if (targetMembership.role == TripRole.OWNER && role != TripRole.OWNER) {
            val remainingOwners = trip.memberships.count {
                it.role == TripRole.OWNER && it.userId != targetUserId
            }
            if (remainingOwners == 0) {
                throw IllegalArgumentException("Trip must have at least one owner")
            }
        }

        val updatedMemberships = trip.memberships.map {
            if (it.userId == targetUserId) it.copy(role = role) else it
        }
        return AccessResult.Success(tripRepository.save(trip.copy(memberships = updatedMemberships)))
    }

    fun changeInviteRole(tripId: TripId, actorUserId: UserId, email: String, role: TripRole): AccessResult<Trip> {
        val trip = tripRepository.findById(tripId) ?: return AccessResult.NotFound
        if (!trip.hasRole(actorUserId, TripRole.OWNER)) return AccessResult.Forbidden

        val normalizedEmail = normalizeEmail(email)
        val inviteIndex = trip.invites.indexOfFirst {
            it.email.equals(normalizedEmail, ignoreCase = true) && it.status == InviteStatus.PENDING
        }
        if (inviteIndex < 0) return AccessResult.NotFound

        val updatedInvites = trip.invites.toMutableList()
        updatedInvites[inviteIndex] = updatedInvites[inviteIndex].copy(role = role)
        return AccessResult.Success(tripRepository.save(trip.copy(invites = updatedInvites)))
    }

    fun getCollaborators(tripId: TripId, requesterUserId: UserId): AccessResult<Trip> {
        val trip = tripRepository.findById(tripId) ?: return AccessResult.NotFound
        if (!trip.hasRole(requesterUserId, TripRole.OWNER)) return AccessResult.Forbidden
        return AccessResult.Success(trip)
    }

    fun existsTrip(tripId: TripId): Boolean =
        tripRepository.findById(tripId) != null

    private fun upsertMembershipRole(
        memberships: List<TripMembership>,
        userId: UserId,
        role: TripRole,
    ): List<TripMembership> {
        val index = memberships.indexOfFirst { it.userId == userId }
        if (index < 0) return memberships + TripMembership(userId = userId, role = role)

        val updated = memberships.toMutableList()
        updated[index] = updated[index].copy(role = role)
        return updated
    }

    private fun normalizeEmail(email: String): String = email.trim().lowercase()

}
