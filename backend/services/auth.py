import bcrypt
import psycopg2
from db import get_connection

class AuthService:
    @staticmethod
    def get_connection():
        return get_connection()

    @staticmethod
    def hash_password(password):
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    @staticmethod
    def verify_password(password, password_hash):
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

    @staticmethod
    def user_exists(email):
        """Check if user exists by email"""
        with AuthService.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "SELECT 1 FROM users WHERE LOWER(email) = LOWER(%s)",
                    (email.strip(),),
                )
                return cursor.fetchone() is not None

    @staticmethod
    def create_user(email, password, first_name="", last_name=""):
        """Create new user with email and password"""
        email = email.strip().lower()
        try:
            with AuthService.get_connection() as conn:
                with conn.cursor() as cursor:
                    password_hash = AuthService.hash_password(password)
                    cursor.execute("""
                        INSERT INTO users (email, password_hash, first_name, last_name, is_google_user)
                        VALUES (%s, %s, %s, %s, FALSE)
                        RETURNING id, email, first_name, last_name
                    """, (email, password_hash, first_name.strip(), last_name.strip()))
                    user = cursor.fetchone()

            return {
                "id": user[0],
                "email": user[1],
                "first_name": user[2],
                "last_name": user[3]
            }
        except psycopg2.IntegrityError:
            return None

    @staticmethod
    def get_user_by_email(email):
        """Get user by email"""
        with AuthService.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT id, email, password_hash, first_name, last_name, google_id, profile_picture, is_google_user
                    FROM users WHERE LOWER(email) = LOWER(%s)
                """, (email.strip(),))
                result = cursor.fetchone()

        if result:
            return {
                "id": result[0],
                "email": result[1],
                "password_hash": result[2],
                "first_name": result[3],
                "last_name": result[4],
                "google_id": result[5],
                "profile_picture": result[6],
                "is_google_user": result[7]
            }
        return None

    @staticmethod
    def get_user_by_id(user_id):
        """Get user by ID"""
        with AuthService.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT id, email, first_name, last_name, google_id, profile_picture, is_google_user
                    FROM users WHERE id = %s
                """, (user_id,))
                result = cursor.fetchone()

        if result:
            return {
                "id": result[0],
                "email": result[1],
                "first_name": result[2],
                "last_name": result[3],
                "google_id": result[4],
                "profile_picture": result[5],
                "is_google_user": result[6]
            }
        return None

    @staticmethod
    def create_google_user(google_id, email, first_name, last_name, profile_picture):
        """Create or connect a user from Google OAuth."""
        email = email.strip().lower()
        with AuthService.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id FROM users WHERE LOWER(email) = LOWER(%s)", (email,))
                existing = cursor.fetchone()

                if existing:
                    cursor.execute("""
                        UPDATE users
                        SET google_id = %s,
                            profile_picture = %s,
                            is_google_user = TRUE,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                        RETURNING id, email, first_name, last_name
                    """, (google_id, profile_picture, existing[0]))
                else:
                    cursor.execute("""
                        INSERT INTO users (email, google_id, first_name, last_name, profile_picture, is_google_user)
                        VALUES (%s, %s, %s, %s, %s, TRUE)
                        RETURNING id, email, first_name, last_name
                    """, (email, google_id, first_name, last_name, profile_picture))

                user = cursor.fetchone()

        return {
            "id": user[0],
            "email": user[1],
            "first_name": user[2],
            "last_name": user[3]
        }
