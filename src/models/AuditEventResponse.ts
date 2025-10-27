export type AuditEventResponse = {
    id: string;
    responsibleId: string,
    responsibleFirstName: string,
    responsibleLastName: string,
    responsibleProfilePictureUrl: string,
    eventType: string;
    resourceType: string;
    resourceId: string;
    occurredAt: Date;
}