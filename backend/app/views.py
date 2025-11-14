from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, generics
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser, Level, Feedback
from .serializers import UserSerializer, SignupSerializer, LevelSerializer, FeedbackSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint for Render"""
    level_count = Level.objects.count()
    return Response({
        'status': 'healthy',
        'service': 'django-backend',
        'levels_in_db': level_count,
    })

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class SignupView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = get_tokens_for_user(user)
            user_data = UserSerializer(user).data
            return Response({**tokens, 'user': user_data}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({'detail': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user_obj = CustomUser.objects.get(email=email)
            user = authenticate(request, username=user_obj.username, password=password)
        except CustomUser.DoesNotExist:
            user = None

        if user is not None:
            tokens = get_tokens_for_user(user)
            user_data = UserSerializer(user).data
            return Response({**tokens, 'user': user_data}, status=status.HTTP_200_OK)
        return Response({'detail': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)


class LevelListView(generics.ListAPIView):
    queryset = Level.objects.all().order_by('id')
    serializer_class = LevelSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LevelDetailView(generics.RetrieveAPIView):
    queryset = Level.objects.all()
    serializer_class = LevelSerializer
    permission_classes = [permissions.IsAuthenticated]


class SaveFeedbackView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        data = request.data
        user = request.user
        try:
            level = Level.objects.get(id=int(data.get('level_id')))
        except Level.DoesNotExist:
            return Response({'detail': 'Level not found'}, status=status.HTTP_404_NOT_FOUND)

        feedback = Feedback.objects.create(
            user=user,
            level=level,
            transcript=data.get('transcript', ''),
            grammar_score=float(data.get('grammar_score', 0)),
            vocabulary_score=float(data.get('vocabulary_score', 0)),
            fluency_score=float(data.get('fluency_score', 0)),
            topic_relevance_score=float(data.get('topic_relevance_score', 0)),
            feedback_text=data.get('feedback_text', ''),
        )

        # Update user XP and completed levels
        avg = (feedback.grammar_score + feedback.vocabulary_score + feedback.fluency_score + feedback.topic_relevance_score) / 4.0
        xp_earned = int(round(avg * 10))
        user.xp = (user.xp or 0) + xp_earned
        completed = user.completed_levels or []
        if level.id not in completed:
            completed.append(level.id)
        user.completed_levels = completed
        user.save()

        return Response({'detail': 'Feedback saved', 'xp_earned': xp_earned}, status=status.HTTP_201_CREATED)


class UserProgressView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'xp': user.xp or 0,
            'completed_levels': user.completed_levels or [],
        })


class FeedbackByLevelView(generics.ListAPIView):
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        level_id = self.kwargs.get('level_id')
        return Feedback.objects.filter(level_id=level_id, user=self.request.user).order_by('-created_at')


class UserFeedbackView(generics.ListAPIView):
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Feedback.objects.filter(user=self.request.user).order_by('-created_at')
