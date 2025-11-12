from rest_framework import serializers
from .models import CustomUser, Level, Feedback


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'xp', 'completed_levels', 'first_name', 'last_name', 'language']


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    username = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'language']

    def validate_email(self, value):
        """Check if email already exists"""
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def create(self, validated_data):
        # Generate username from email if not provided
        username = validated_data.get('username') or validated_data['email'].split('@')[0]
        
        # Ensure username is unique
        base_username = username
        counter = 1
        while CustomUser.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        user = CustomUser.objects.create(
            username=username,
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            language=validated_data.get('language', 'English'),
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


class LevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Level
        fields = ['id', 'topic', 'difficulty', 'text', 'text_german']


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['id', 'user', 'level', 'transcript', 'grammar_score', 'vocabulary_score', 'fluency_score', 'topic_relevance_score', 'feedback_text', 'created_at']
        read_only_fields = ['id', 'created_at']
