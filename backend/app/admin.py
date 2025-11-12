from django.contrib import admin
from .models import CustomUser, Level, Feedback
from django.contrib.auth.admin import UserAdmin


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('email', 'username', 'xp')
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('xp', 'completed_levels')}),
    )


@admin.register(Level)
class LevelAdmin(admin.ModelAdmin):
    list_display = ('id', 'topic', 'difficulty')


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'level', 'created_at')
