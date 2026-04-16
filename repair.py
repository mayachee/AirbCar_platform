import os

code = """
class CarShareRequestViewSet(viewsets.ModelViewSet):
    \"\"\"
    ViewSet for managing B2B Car Share Requests.
    \"\"\"
    queryset = CarShareRequest.objects.all()
    serializer_class = CarShareRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        partner = getattr(user, 'partner_profile', None)
        if not partner:
            return CarShareRequest.objects.none()
        
        return CarShareRequest.objects.filter(
            Q(owner=partner) | Q(requester=partner)
        ).select_related('requester', 'owner', 'listing')

    
    def perform_create(self, serializer):
        car_share = serializer.save()
        _create_notification_safe(
            user=car_share.owner.user,
            title="New B2B Car Share Request",
            message=f"{car_share.requester.business_name} has requested to borrow {car_share.listing.make} {car_share.listing.model}.",
            type="info",
            related_object_type="car_share"
        )

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        try: pass
        except Exception as e: import traceback; traceback.print_exc()
        car_share = self.get_object()
        
        user = request.user
        partner = getattr(user, 'partner_profile', None)
        
        if not partner or car_share.owner != partner:
            return Response(
                {"error": "Only the car owner can update the status."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        new_status = request.data.get('status')
        if new_status not in ['accepted', 'rejected']:
            return Response(
                {"error": "Invalid status. Must be 'accepted' or 'rejected'."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        car_share.status = new_status
        car_share.save()
        
        if new_status == 'accepted':
            from django.db.models import F
            requester = car_share.requester
            owner = car_share.owner
            requester.total_earnings = F('total_earnings') - car_share.total_price
            owner.total_earnings = F('total_earnings') + car_share.total_price
            requester.save(update_fields=['total_earnings'])
            owner.save(update_fields=['total_earnings'])
            requester.refresh_from_db(fields=['total_earnings'])
            owner.refresh_from_db(fields=['total_earnings'])
            
            try:
                _create_notification_safe(
                    user=requester.user,
                    title="B2B Share Accepted",
                    message=f"Your request to borrow {car_share.listing.make} has been accepted by {owner.business_name}. {car_share.total_price} has been deducted from your earnings.",
                    type="success",
                    related_object_type="car_share"
                )
            except NameError:
                pass # If safe_notification fail
            
        elif new_status == 'rejected':
            try:
                _create_notification_safe(
                    user=car_share.requester.user,
                    title="B2B Share Rejected",
                    message=f"{car_share.owner.business_name} has rejected your request to borrow {car_share.listing.make}.",
                    type="error",
                    related_object_type="car_share"
                )
            except NameError:
                pass


        serializer = self.get_serializer(car_share)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get', 'post'])
    def messages(self, request, pk=None):
        car_share = self.get_object()
        partner = getattr(request.user, 'partner_profile', None)

        if not partner or (car_share.requester != partner and car_share.owner != partner):
            return Response({"error": "Only participants can access messages."}, status=status.HTTP_403_FORBIDDEN)

        if request.method == 'POST':
            serializer = B2BMessageSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(car_share_request=car_share, sender=partner)
            
            other_partner = car_share.owner if partner == car_share.requester else car_share.requester
            try:
                _create_notification_safe(
                    user=other_partner.user,
                    title="New B2B Message",
                    message=f"You have a new message from {partner.business_name} regarding {car_share.listing.make}.",
                    type="info",
                    related_object_type="car_share"
                )
            except NameError:
                pass

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        messages = car_share.messages.all().order_by('created_at')
        serializer = B2BMessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'])
    def inspections(self, request, pk=None):
        car_share = self.get_object()
        partner = getattr(request.user, 'partner_profile', None)

        if not partner or (car_share.requester != partner and car_share.owner != partner):
            return Response({"error": "Only participants can access inspections."}, status=status.HTTP_403_FORBIDDEN)

        if request.method == 'POST':
            serializer = VehicleInspectionSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            inspection = serializer.save(car_share_request=car_share, recorded_by=partner)
            
            other_partner = car_share.owner if partner == car_share.requester else car_share.requester
            try:
                _create_notification_safe(
                    user=other_partner.user,
                    title="New Vehicle Inspection",
                    message=f"{partner.business_name} has submitted a new inspection for {car_share.listing.make}.",
                    type="info",
                    related_object_type="car_share"
                )
            except NameError:
                pass
                
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        inspections = car_share.inspections.all().order_by('created_at')
        serializer = VehicleInspectionSerializer(inspections, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path=r'inspections/(?P<insp_id>\\d+)/approve')
    def approve_inspection(self, request, pk=None, insp_id=None):
        car_share = self.get_object()
        partner = getattr(request.user, 'partner_profile', None)

        if not partner or (car_share.requester != partner and car_share.owner != partner):
            return Response({"error": "Only participants can approve inspections."}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            inspection = car_share.inspections.get(id=insp_id)
        except Exception:
            return Response({"error": "Inspection not found."}, status=status.HTTP_404_NOT_FOUND)
            
        if inspection.recorded_by == partner:
            return Response({"error": "You cannot approve your own inspection."}, status=status.HTTP_403_FORBIDDEN)
            
        inspection.approved = True
        inspection.save(update_fields=['approved'])
        
        try:
            _create_notification_safe(
                user=inspection.recorded_by.user,
                title="Inspection Approved",
                message=f"{partner.business_name} has approved your inspection for {car_share.listing.make}.",
                type="success",
                related_object_type="car_share"
            )
        except NameError:
            pass
            
        serializer = VehicleInspectionSerializer(inspection)
        return Response(serializer.data, status=status.HTTP_200_OK)
"""

with open('backend/airbcar_backend/core/views/partner_views.py', 'a', encoding='utf-8') as f:
    f.write("\n\n" + code)
