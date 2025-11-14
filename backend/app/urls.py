from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.SignupView.as_view(), name='signup'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('levels/', views.LevelListView.as_view(), name='levels'),
    path('levels/<int:pk>/', views.LevelDetailView.as_view(), name='level-detail'),
    path('save_feedback/', views.SaveFeedbackView.as_view(), name='save-feedback'),
    path('user_progress/', views.UserProgressView.as_view(), name='user-progress'),
    path('user_feedback/', views.UserFeedbackView.as_view(), name='user-feedback'),
    path('feedback/<int:level_id>/', views.FeedbackByLevelView.as_view(), name='feedback-by-level'),
]
