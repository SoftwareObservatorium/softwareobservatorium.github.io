export class User {
    //id: number;
    username!: string;
    password!: string;
    //firstName: string;
    //lastName: string;
    email!: string;

    token?: string;

    // roles
    roles!: string[];
}

export class LslRequest {
    script: string;
    email: string;
    permissionType: string;
    type: string;

    label: string;
    description: string;
    tags: string[];
}

export class LslResponse {
    script: string;
    executionId: string;
    status: string;
}

export class ScriptInfo {
    executionId: string;
    name: string;
    status: string;
    start: Date;
    end: Date;
    content: string;
    owner: string;

    label: string;
    description: string;
    permissionType: string;
    tags: string[];
}

export class SearchSrmQueryRequest {
    executionId: string;
    forAction!: string;
}

export class AbstractionInfo {
    name: string;
    action: string;
    specification!: any;
    codeUnits!: any[];
}

export class SearchSrmQueryResponse {
    abstractions: AbstractionInfo[];
    actions: string[];
}


export class SheetSpec {
    signature!: string
    interfaceSpecification!: string
    body!: string
    invocations!: string[];
    implementationId!: string
}

export class SearchQueryRequest {
    query: string
    filters: string[]
    sortyBy: string[]

    oracleFilters: any;

    strategy: string

    start: number
    rows: number

    executionId: string

    forAction: string
}

export class SearchQueryResponse {
    implementations: Map<string, Object>;

    total: number
    rows: number

    actions: string[]
}

export class TextualSearch {
    lql: string;
    filters: string[];
    strategy: string;
}

export type CodeSnippet = {
    clonesDetected: any; // You can further type these
    workerNodeId: string | null;
    id: string;
    dataSource: string;
    parentId: string | null;
    name: string;
    packagename: string;
    bytecodeName: string;
    groupId: string;
    artifactId: string;
    version: string;
    classifier: string | null;
    score: number;
    content: string;
    hash: string;
    type1Hash: string | null;
    docType: string;
    type: string;
    methods: string[];
    superClasses: string[];
    interfaces: string[] | null;
    dependencies: string[];
    measures: { [k: string]: number };
    metaData: {
        meta_dependency_ss?: string[];
        meta_name_s?: string[];
        meta_url_s?: string[];
        meta_description_s?: string[];
    };
    inheritedMethods: any[];
    alternatives: any[];
    clones: any[];
    similar: any[];
    type1Clones: any;
    unitType: string;
    methodSignatureParamsOrderedKeywordsFq: string[];
    methodNames: string[];
    methodBytecodeNames: string[];
    lql: string;
};

export class CodeVersion {
    id: string;
    variantId: string;
    adapterId: string;
    oracle: boolean;
}

// ranking

export class SystemMeta {
    id: string;
    variantId: string;
    adapterId: string;
    measures: any;
}

export class RankedCandidate {
    rank: number;
    candidate: SystemMeta;
}

export class RankingCriterion {
    id: string;
    objective: number;
    weight: number;
    priority: number;
}

export class RankRequest {
    strategy: string;
    candidates: SystemMeta[];
    criteria: RankingCriterion[];
}

export class RankResponse {
    rankedCandidates: RankedCandidate[];
}