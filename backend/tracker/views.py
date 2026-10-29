from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Q
from .models import Client, Invoice
from .serializers import ClientSerializer, InvoiceSerializer


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all().order_by("-created")
    serializer_class = ClientSerializer


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related("client").order_by("-created")
    serializer_class = InvoiceSerializer


class SummaryView(APIView):
    def get(self, request):
        unpaid = Invoice.objects.filter(status="unpaid")
        total = unpaid.aggregate(total=Sum("amount"))["total"] or 0
        return Response({
            "clients": Client.objects.count(),
            "unpaid_count": unpaid.count(),
            "unpaid_total": str(total),
        })