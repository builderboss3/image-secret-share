import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { CreateMessageBody, DecodeImageBody, DecodeResult, ErrorResponse, GenerateImageBody, GeneratedImage, HealthStatus, ImageDecodeStatus, MarkReadBody, Message, MessageStats, MessageStatus } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary List sent messages for the authenticated user
 */
export declare const getListMessagesUrl: () => string;
export declare const listMessages: (options?: RequestInit) => Promise<Message[]>;
export declare const getListMessagesQueryKey: () => readonly ["/api/messages"];
export declare const getListMessagesQueryOptions: <TData = Awaited<ReturnType<typeof listMessages>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listMessages>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listMessages>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListMessagesQueryResult = NonNullable<Awaited<ReturnType<typeof listMessages>>>;
export type ListMessagesQueryError = ErrorType<unknown>;
/**
 * @summary List sent messages for the authenticated user
 */
export declare function useListMessages<TData = Awaited<ReturnType<typeof listMessages>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listMessages>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Create a new secret message embedded in an image
 */
export declare const getCreateMessageUrl: () => string;
export declare const createMessage: (createMessageBody: CreateMessageBody, options?: RequestInit) => Promise<Message>;
export declare const getCreateMessageMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createMessage>>, TError, {
        data: BodyType<CreateMessageBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createMessage>>, TError, {
    data: BodyType<CreateMessageBody>;
}, TContext>;
export type CreateMessageMutationResult = NonNullable<Awaited<ReturnType<typeof createMessage>>>;
export type CreateMessageMutationBody = BodyType<CreateMessageBody>;
export type CreateMessageMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Create a new secret message embedded in an image
 */
export declare const useCreateMessage: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createMessage>>, TError, {
        data: BodyType<CreateMessageBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createMessage>>, TError, {
    data: BodyType<CreateMessageBody>;
}, TContext>;
/**
 * @summary Get dashboard stats for sent messages
 */
export declare const getGetMessageStatsUrl: () => string;
export declare const getMessageStats: (options?: RequestInit) => Promise<MessageStats>;
export declare const getGetMessageStatsQueryKey: () => readonly ["/api/messages/stats"];
export declare const getGetMessageStatsQueryOptions: <TData = Awaited<ReturnType<typeof getMessageStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMessageStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMessageStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMessageStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getMessageStats>>>;
export type GetMessageStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get dashboard stats for sent messages
 */
export declare function useGetMessageStats<TData = Awaited<ReturnType<typeof getMessageStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMessageStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Decode a message from an uploaded carrier image — no ID needed
 */
export declare const getDecodeImageUrl: () => string;
export declare const decodeImage: (decodeImageBody: DecodeImageBody, options?: RequestInit) => Promise<ImageDecodeStatus>;
export declare const getDecodeImageMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof decodeImage>>, TError, {
        data: BodyType<DecodeImageBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof decodeImage>>, TError, {
    data: BodyType<DecodeImageBody>;
}, TContext>;
export type DecodeImageMutationResult = NonNullable<Awaited<ReturnType<typeof decodeImage>>>;
export type DecodeImageMutationBody = BodyType<DecodeImageBody>;
export type DecodeImageMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Decode a message from an uploaded carrier image — no ID needed
 */
export declare const useDecodeImage: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof decodeImage>>, TError, {
        data: BodyType<DecodeImageBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof decodeImage>>, TError, {
    data: BodyType<DecodeImageBody>;
}, TContext>;
/**
 * @summary Get a specific message (sender view with receipt)
 */
export declare const getGetMessageUrl: (id: string) => string;
export declare const getMessage: (id: string, options?: RequestInit) => Promise<Message>;
export declare const getGetMessageQueryKey: (id: string) => readonly [`/api/messages/${string}`];
export declare const getGetMessageQueryOptions: <TData = Awaited<ReturnType<typeof getMessage>>, TError = ErrorType<ErrorResponse>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMessage>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMessage>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMessageQueryResult = NonNullable<Awaited<ReturnType<typeof getMessage>>>;
export type GetMessageQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get a specific message (sender view with receipt)
 */
export declare function useGetMessage<TData = Awaited<ReturnType<typeof getMessage>>, TError = ErrorType<ErrorResponse>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMessage>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Delete a message
 */
export declare const getDeleteMessageUrl: (id: string) => string;
export declare const deleteMessage: (id: string, options?: RequestInit) => Promise<void>;
export declare const getDeleteMessageMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteMessage>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteMessage>>, TError, {
    id: string;
}, TContext>;
export type DeleteMessageMutationResult = NonNullable<Awaited<ReturnType<typeof deleteMessage>>>;
export type DeleteMessageMutationError = ErrorType<unknown>;
/**
 * @summary Delete a message
 */
export declare const useDeleteMessage: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteMessage>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteMessage>>, TError, {
    id: string;
}, TContext>;
/**
 * @summary Get message status for the receiver (check if locked, if already read)
 */
export declare const getGetMessageStatusUrl: (id: string) => string;
export declare const getMessageStatus: (id: string, options?: RequestInit) => Promise<MessageStatus>;
export declare const getGetMessageStatusQueryKey: (id: string) => readonly [`/api/messages/${string}/status`];
export declare const getGetMessageStatusQueryOptions: <TData = Awaited<ReturnType<typeof getMessageStatus>>, TError = ErrorType<ErrorResponse>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMessageStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMessageStatus>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMessageStatusQueryResult = NonNullable<Awaited<ReturnType<typeof getMessageStatus>>>;
export type GetMessageStatusQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get message status for the receiver (check if locked, if already read)
 */
export declare function useGetMessageStatus<TData = Awaited<ReturnType<typeof getMessageStatus>>, TError = ErrorType<ErrorResponse>>(id: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMessageStatus>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Decode and reveal the hidden message (one-time, requires access)
 */
export declare const getDecodeMessageUrl: (id: string) => string;
export declare const decodeMessage: (id: string, options?: RequestInit) => Promise<DecodeResult>;
export declare const getDecodeMessageMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof decodeMessage>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof decodeMessage>>, TError, {
    id: string;
}, TContext>;
export type DecodeMessageMutationResult = NonNullable<Awaited<ReturnType<typeof decodeMessage>>>;
export type DecodeMessageMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Decode and reveal the hidden message (one-time, requires access)
 */
export declare const useDecodeMessage: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof decodeMessage>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof decodeMessage>>, TError, {
    id: string;
}, TContext>;
/**
 * @summary Mark message as read with timing information
 */
export declare const getMarkMessageReadUrl: (id: string) => string;
export declare const markMessageRead: (id: string, markReadBody: MarkReadBody, options?: RequestInit) => Promise<Message>;
export declare const getMarkMessageReadMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof markMessageRead>>, TError, {
        id: string;
        data: BodyType<MarkReadBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof markMessageRead>>, TError, {
    id: string;
    data: BodyType<MarkReadBody>;
}, TContext>;
export type MarkMessageReadMutationResult = NonNullable<Awaited<ReturnType<typeof markMessageRead>>>;
export type MarkMessageReadMutationBody = BodyType<MarkReadBody>;
export type MarkMessageReadMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Mark message as read with timing information
 */
export declare const useMarkMessageRead: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof markMessageRead>>, TError, {
        id: string;
        data: BodyType<MarkReadBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof markMessageRead>>, TError, {
    id: string;
    data: BodyType<MarkReadBody>;
}, TContext>;
/**
 * @summary Sender grants access to a locked message
 */
export declare const getGrantMessageAccessUrl: (id: string) => string;
export declare const grantMessageAccess: (id: string, options?: RequestInit) => Promise<Message>;
export declare const getGrantMessageAccessMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof grantMessageAccess>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof grantMessageAccess>>, TError, {
    id: string;
}, TContext>;
export type GrantMessageAccessMutationResult = NonNullable<Awaited<ReturnType<typeof grantMessageAccess>>>;
export type GrantMessageAccessMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Sender grants access to a locked message
 */
export declare const useGrantMessageAccess: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof grantMessageAccess>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof grantMessageAccess>>, TError, {
    id: string;
}, TContext>;
/**
 * @summary Sender revokes access to a locked message
 */
export declare const getRevokeMessageAccessUrl: (id: string) => string;
export declare const revokeMessageAccess: (id: string, options?: RequestInit) => Promise<Message>;
export declare const getRevokeMessageAccessMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof revokeMessageAccess>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof revokeMessageAccess>>, TError, {
    id: string;
}, TContext>;
export type RevokeMessageAccessMutationResult = NonNullable<Awaited<ReturnType<typeof revokeMessageAccess>>>;
export type RevokeMessageAccessMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Sender revokes access to a locked message
 */
export declare const useRevokeMessageAccess: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof revokeMessageAccess>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof revokeMessageAccess>>, TError, {
    id: string;
}, TContext>;
/**
 * @summary Generate a carrier image (solid color, gradient, noise pattern)
 */
export declare const getGenerateCarrierImageUrl: () => string;
export declare const generateCarrierImage: (generateImageBody: GenerateImageBody, options?: RequestInit) => Promise<GeneratedImage>;
export declare const getGenerateCarrierImageMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof generateCarrierImage>>, TError, {
        data: BodyType<GenerateImageBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof generateCarrierImage>>, TError, {
    data: BodyType<GenerateImageBody>;
}, TContext>;
export type GenerateCarrierImageMutationResult = NonNullable<Awaited<ReturnType<typeof generateCarrierImage>>>;
export type GenerateCarrierImageMutationBody = BodyType<GenerateImageBody>;
export type GenerateCarrierImageMutationError = ErrorType<ErrorResponse>;
/**
 * @summary Generate a carrier image (solid color, gradient, noise pattern)
 */
export declare const useGenerateCarrierImage: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof generateCarrierImage>>, TError, {
        data: BodyType<GenerateImageBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof generateCarrierImage>>, TError, {
    data: BodyType<GenerateImageBody>;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map