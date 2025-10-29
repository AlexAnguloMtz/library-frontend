export type FullAuditEventResponse = {
    id: string;
    responsibleId: string,
    responsibleFirstName: string,
    responsibleLastName: string,
    responsibleProfilePictureUrl: string,
    eventData: string;
    eventDataPretty: string;
    eventType: string;
    resourceType: string;
    occurredAt: Date;
}