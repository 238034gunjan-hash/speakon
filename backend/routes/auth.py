from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from services.auth import AuthService
from datetime import timedelta
import os
from dotenv import load_dotenv
from google.auth.transport import requests
from google.oauth2 import id_token

load_dotenv()

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

JWT_EXPIRY_HOURS = 24

@auth_bp.route('/signup', methods=['POST'])
def signup():
    """Register a new user with email and password"""
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({"error": "Email and password are required"}), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        
        # Check if user already exists
        if AuthService.user_exists(email):
            return jsonify({"error": "User already exists"}), 400
        
        # Create new user
        user = AuthService.create_user(email, password, first_name, last_name)
        
        if not user:
            return jsonify({"error": "Failed to create user"}), 500
        
        # Create JWT tokens
        access_token = create_access_token(
            identity=str(user['id']),
            expires_delta=timedelta(hours=JWT_EXPIRY_HOURS)
        )
        refresh_token = create_refresh_token(identity=str(user['id']))
        
        return jsonify({
            "message": "User created successfully",
            "user": user,
            "access_token": access_token,
            "refresh_token": refresh_token
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user with email and password"""
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({"error": "Email and password are required"}), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password')
        
        # Get user
        user = AuthService.get_user_by_email(email)
        
        if not user:
            return jsonify({"error": "Invalid email or password"}), 401
        
        # Check if user is a Google-only account
        if user['is_google_user'] and not user['password_hash']:
            return jsonify({"error": "Please sign in with Google"}), 401
        
        # Verify password
        if not user['password_hash'] or not AuthService.verify_password(password, user['password_hash']):
            return jsonify({"error": "Invalid email or password"}), 401
        
        # Create JWT tokens
        access_token = create_access_token(
            identity=str(user['id']),
            expires_delta=timedelta(hours=JWT_EXPIRY_HOURS)
        )
        refresh_token = create_refresh_token(identity=str(user['id']))
        
        # Return user info without password
        user_response = {
            "id": user['id'],
            "email": user['email'],
            "first_name": user['first_name'],
            "last_name": user['last_name'],
            "profile_picture": user['profile_picture']
        }
        
        return jsonify({
            "message": "Login successful",
            "user": user_response,
            "access_token": access_token,
            "refresh_token": refresh_token
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route('/google', methods=['POST'])
def google_signin():
    """Google OAuth sign-in"""
    try:
        data = request.get_json()
        
        if not data or not data.get('token'):
            return jsonify({"error": "Google token is required"}), 400
        
        token = data.get('token')
        
        # Verify token with Google
        try:
            GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
            if not GOOGLE_CLIENT_ID:
                return jsonify({"error": "Google sign-in is not configured"}), 503

            idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
            if not idinfo.get('email_verified'):
                return jsonify({"error": "Google email is not verified"}), 401
            
            # Extract user info from token
            google_id = idinfo['sub']
            email = idinfo['email']
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')
            profile_picture = idinfo.get('picture', '')
            
            # Create or get user
            user = AuthService.create_google_user(google_id, email, first_name, last_name, profile_picture)
            
            if not user:
                return jsonify({"error": "Failed to process Google sign-in"}), 500
            
            # Create JWT tokens
            access_token = create_access_token(
                identity=str(user['id']),
                expires_delta=timedelta(hours=JWT_EXPIRY_HOURS)
            )
            refresh_token = create_refresh_token(identity=str(user['id']))
            
            return jsonify({
                "message": "Google sign-in successful",
                "user": user,
                "access_token": access_token,
                "refresh_token": refresh_token
            }), 200
            
        except ValueError:
            return jsonify({"error": "Invalid Google token"}), 401
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        user_id = get_jwt_identity()
        
        access_token = create_access_token(
            identity=user_id,
            expires_delta=timedelta(hours=JWT_EXPIRY_HOURS)
        )
        
        return jsonify({
            "access_token": access_token
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    try:
        user_id = get_jwt_identity()
        user = AuthService.get_user_by_id(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({
            "user": user
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (frontend should delete token)"""
    return jsonify({
        "message": "Logout successful"
    }), 200


@auth_bp.route('/config', methods=['GET'])
def auth_config():
    """Return public authentication configuration used by the frontend."""
    return jsonify({
        "google_client_id": os.getenv('GOOGLE_CLIENT_ID', '')
    }), 200
