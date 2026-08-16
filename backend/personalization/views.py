from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.models import AnonymousUser
from .models import InterventionDecision, UserPersonalizationProfile
from .serializers import (
    InterventionDecisionCreateSerializer,
    InterventionDecisionSerializer,
    UserPersonalizationProfileSerializer,
)
from .services import (
    decide_and_record_intervention,
    refresh_user_personalization_profile,
)


# 오늘 개인화 개입 결정 생성
class InterventionDecisionView(APIView):

    def post(self, request, uuid):
        user = get_object_or_404(
            AnonymousUser,
            uuid=uuid,
        )
        serializer = InterventionDecisionCreateSerializer(
            data=request.data
        )
        serializer.is_valid(
            raise_exception=True
        )
        data = serializer.validated_data

        decision = decide_and_record_intervention(
            user=user,
            tinnitus_discomfort=data["tinnitus_discomfort"],
            anxiety=data["anxiety"],
            stress=data["stress"],
            fatigue=data.get("fatigue"),
            caffeine=data.get("caffeine", False),
        )

        response_serializer = InterventionDecisionSerializer(
            decision
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
        )


# 가장 최근 개인화 결정 조회
class LatestInterventionDecisionView(APIView):

    def get(self, request, uuid):
        user = get_object_or_404(
            AnonymousUser,
            uuid=uuid,
        )

        decision = (
            InterventionDecision.objects
            .filter(user=user)
            .order_by("-decided_at")
            .first()
        )

        if decision is None:
            return Response(
                {
                    "detail": "아직 생성된 개인화 결정이 없습니다."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = InterventionDecisionSerializer(
            decision
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


# 사용자 개인화 프로필 조회
class UserPersonalizationProfileView(APIView):

    def get(self, request, uuid):
        user = get_object_or_404(
            AnonymousUser,
            uuid=uuid,
        )

        profile = (
            UserPersonalizationProfile.objects
            .filter(user=user)
            .first()
        )

        if profile is None:
            return Response(
                {
                    "sound_tag_weights": {},
                    "excluded_sound_tags": [],
                    "relaxation_type_weights": {},
                    "discouraged_relaxation_types": [],
                    "evaluation_sample_count": 0,
                    "sound_sample_count": 0,
                    "relaxation_sample_count": 0,
                    "last_updated_at": None,
                },
                status=status.HTTP_200_OK,
            )

        serializer = UserPersonalizationProfileSerializer(
            profile
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


# 평가 결과 기반 개인화 프로필 갱신
class RefreshPersonalizationProfileView(APIView):

    def post(self, request, uuid):
        user = get_object_or_404(
            AnonymousUser,
            uuid=uuid,
        )

        profile = refresh_user_personalization_profile(
            user
        )

        serializer = UserPersonalizationProfileSerializer(
            profile
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )