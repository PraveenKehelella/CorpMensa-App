from django.urls import path

from .views import ClientDetailView, ClientsCollectionView, VitalsExtractView

urlpatterns = [
    path("clients/", ClientsCollectionView.as_view(), name="clients-collection"),
    path("clients/<str:client_id>/", ClientDetailView.as_view(), name="client-detail"),
    path("vitals/extract/", VitalsExtractView.as_view(), name="vitals-extract"),
]
