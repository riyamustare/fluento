from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.postgres.fields import ArrayField
from django.utils import timezone
import json


class CustomUser(AbstractUser):
    # Use email as unique identifier in practice; keep username for compatibility
    email = models.EmailField(unique=True)
    xp = models.IntegerField(default=0)
    completed_levels = models.JSONField(default=list)
    # Preferred language for the user ('English' or 'German')
    language = models.CharField(max_length=20, default='English')

    def __str__(self):
        return self.email


class Level(models.Model):
    topic = models.CharField(max_length=255)
    difficulty = models.IntegerField(default=1)
    text = models.TextField(blank=True)  # English text for read mode
    text_german = models.TextField(blank=True)  # German text for read mode

    def __str__(self):
        return f"Level {self.id}: {self.topic}"


class Feedback(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    level = models.ForeignKey(Level, on_delete=models.CASCADE)
    transcript = models.TextField(blank=True)
    grammar_score = models.FloatField(default=0.0)
    vocabulary_score = models.FloatField(default=0.0)
    fluency_score = models.FloatField(default=0.0)
    topic_relevance_score = models.FloatField(default=0.0)
    feedback_text = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Feedback {self.id} by {self.user.email} for Level {self.level.id}"
