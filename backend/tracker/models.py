from django.db import models
from django.conf import settings


class Client(models.Model):
    name = models.CharField(max_length=120)
    email = models.EmailField(blank=True)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Invoice(models.Model):
    STATUS_CHOICES = [
        ("unpaid", "Unpaid"),
        ("paid", "Paid"),
    ]

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="invoices")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="unpaid")
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.client.name} - {self.amount}"