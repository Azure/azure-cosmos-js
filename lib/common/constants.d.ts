export declare const Constants: {
    MediaTypes: {
        Any: string;
        ImageJpeg: string;
        ImagePng: string;
        Javascript: string;
        Json: string;
        OctetStream: string;
        QueryJson: string;
        SQL: string;
        TextHtml: string;
        TextPlain: string;
        Xml: string;
    };
    HttpMethods: {
        Get: string;
        Post: string;
        Put: string;
        Delete: string;
        Head: string;
        Options: string;
    };
    HttpHeaders: {
        Authorization: string;
        ETag: string;
        MethodOverride: string;
        Slug: string;
        ContentType: string;
        LastModified: string;
        ContentEncoding: string;
        CharacterSet: string;
        UserAgent: string;
        IfModifiedSince: string;
        IfMatch: string;
        IfNoneMatch: string;
        ContentLength: string;
        AcceptEncoding: string;
        KeepAlive: string;
        CacheControl: string;
        TransferEncoding: string;
        ContentLanguage: string;
        ContentLocation: string;
        ContentMd5: string;
        ContentRange: string;
        Accept: string;
        AcceptCharset: string;
        AcceptLanguage: string;
        IfRange: string;
        IfUnmodifiedSince: string;
        MaxForwards: string;
        ProxyAuthorization: string;
        AcceptRanges: string;
        ProxyAuthenticate: string;
        RetryAfter: string;
        SetCookie: string;
        WwwAuthenticate: string;
        Origin: string;
        Host: string;
        AccessControlAllowOrigin: string;
        AccessControlAllowHeaders: string;
        KeyValueEncodingFormat: string;
        WrapAssertionFormat: string;
        WrapAssertion: string;
        WrapScope: string;
        SimpleToken: string;
        HttpDate: string;
        Prefer: string;
        Location: string;
        Referer: string;
        A_IM: string;
        Query: string;
        IsQuery: string;
        Continuation: string;
        PageSize: string;
        ActivityId: string;
        PreTriggerInclude: string;
        PreTriggerExclude: string;
        PostTriggerInclude: string;
        PostTriggerExclude: string;
        IndexingDirective: string;
        SessionToken: string;
        ConsistencyLevel: string;
        XDate: string;
        CollectionPartitionInfo: string;
        CollectionServiceInfo: string;
        RetryAfterInMilliseconds: string;
        IsFeedUnfiltered: string;
        ResourceTokenExpiry: string;
        EnableScanInQuery: string;
        EmitVerboseTracesInQuery: string;
        EnableCrossPartitionQuery: string;
        ParallelizeCrossPartitionQuery: string;
        Version: string;
        OwnerFullName: string;
        OwnerId: string;
        PartitionKey: string;
        PartitionKeyRangeID: string;
        MaxEntityCount: string;
        CurrentEntityCount: string;
        CollectionQuotaInMb: string;
        CollectionCurrentUsageInMb: string;
        MaxMediaStorageUsageInMB: string;
        CurrentMediaStorageUsageInMB: string;
        RequestCharge: string;
        PopulateQuotaInfo: string;
        MaxResourceQuota: string;
        OfferType: string;
        OfferThroughput: string;
        DisableRUPerMinuteUsage: string;
        IsRUPerMinuteUsed: string;
        OfferIsRUPerMinuteThroughputEnabled: string;
        IndexTransformationProgress: string;
        LazyIndexingProgress: string;
        IsUpsert: string;
        SubStatus: string;
        EnableScriptLogging: string;
        ScriptLogResults: string;
    };
    WritableLocations: string;
    ReadableLocations: string;
    Name: string;
    DatabaseAccountEndpoint: string;
    ThrottleRetryCount: string;
    ThrottleRetryWaitTimeInMs: string;
    CurrentVersion: string;
    SDKName: string;
    SDKVersion: string;
    DefaultPrecisions: {
        DefaultNumberHashPrecision: number;
        DefaultNumberRangePrecision: number;
        DefaultStringHashPrecision: number;
        DefaultStringRangePrecision: number;
    };
    ConsistentHashRing: {
        DefaultVirtualNodesPerCollection: number;
    };
    RegularExpressions: {
        TrimLeftSlashes: RegExp;
        TrimRightSlashes: RegExp;
        IllegalResourceIdCharacters: RegExp;
    };
    Quota: {
        CollectionSize: string;
    };
    Path: {
        DatabasesPathSegment: string;
        CollectionsPathSegment: string;
        UsersPathSegment: string;
        DocumentsPathSegment: string;
        PermissionsPathSegment: string;
        StoredProceduresPathSegment: string;
        TriggersPathSegment: string;
        UserDefinedFunctionsPathSegment: string;
        ConflictsPathSegment: string;
        AttachmentsPathSegment: string;
        PartitionKeyRangesPathSegment: string;
        SchemasPathSegment: string;
    };
    OperationTypes: {
        Create: string;
        Replace: string;
        Upsert: string;
        Delete: string;
        Read: string;
        Query: string;
    };
    PartitionKeyRange: {
        MinInclusive: string;
        MaxExclusive: string;
        Id: string;
    };
    QueryRangeConstants: {
        MinInclusive: string;
        MaxExclusive: string;
        min: string;
    };
    EffectiveParitionKeyConstants: {
        MinimumInclusiveEffectivePartitionKey: string;
        MaximumExclusiveEffectivePartitionKey: string;
    };
};
