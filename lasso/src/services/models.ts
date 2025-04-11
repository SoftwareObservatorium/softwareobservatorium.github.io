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