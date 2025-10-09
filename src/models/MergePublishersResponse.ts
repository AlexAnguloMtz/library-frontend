import type { PublisherResponse } from "./PublisherResponse";

export type MergePublishersResponse = {
    targetPublisher: PublisherResponse;
    movedBooks: number;
    deletedPublishers: number;
}