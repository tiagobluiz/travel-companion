package com.travelcompanion.infrastructure.auth

import io.jsonwebtoken.Claims
import io.jsonwebtoken.ExpiredJwtException
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.util.Date
import javax.crypto.SecretKey

/**
 * Service for creating and validating JWT access tokens.
 *
 * Tokens contain the user ID and email in claims. Tokens are signed with HMAC-SHA256
 * using a secret key. Used by the auth filter to authenticate requests and by the
 * login endpoint to issue tokens.
 */
@Service
class JwtService(
    @Value("\${app.jwt.secret}")
    private val secret: String,
    @Value("\${app.jwt.expiration-ms:1800000}")
    private val expirationMs: Long,
) {
    private val key: SecretKey by lazy {
        require(secret.length >= 32) { "JWT secret must be at least 32 characters" }
        Keys.hmacShaKeyFor(secret.toByteArray(Charsets.UTF_8))
    }

    /**
     * Creates a JWT for the given user ID and email.
     *
     * @param userId The user's ID
     * @param email The user's email
     * @return The signed JWT string
     */
    fun createToken(userId: String, email: String): String =
        Jwts.builder()
            .subject(userId)
            .claim("email", email)
            .issuedAt(Date())
            .expiration(Date(System.currentTimeMillis() + expirationMs))
            .signWith(key)
            .compact()

    /**
     * Parses and validates a JWT, returning the claims.
     *
     * @param token The JWT string
     * @return The claims if valid
     * @throws ExpiredJwtException if the token has expired
     * @throws io.jsonwebtoken.JwtException if invalid
     */
    fun parseToken(token: String): Claims =
        Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .payload

}
