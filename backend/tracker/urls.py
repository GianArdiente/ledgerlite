from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClientViewSet, InvoiceViewSet, SummaryView

router = DefaultRouter()
router.register("clients", ClientViewSet)
router.register("invoices", InvoiceViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("summary/", SummaryView.as_view()),
]