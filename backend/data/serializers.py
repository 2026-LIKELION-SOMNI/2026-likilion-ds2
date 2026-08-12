from rest_framework import serializers


class HealthConnectionSerializer(serializers.Serializer):
    health_data_connected = serializers.BooleanField()


class DeleteAllResultSerializer(serializers.Serializer):
    deleted_records = serializers.DictField()
    health_data_connected = serializers.BooleanField()