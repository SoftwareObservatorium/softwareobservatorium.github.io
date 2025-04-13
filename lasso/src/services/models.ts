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
    share: boolean;
    type: string;
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