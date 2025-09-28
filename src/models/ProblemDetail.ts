export class ProblemDetailError extends Error {
    public type: string;
    public title: string;
    public status: number;
    public detail: string;
    public instance: string;
    public errors?: ProblemDetailErrors;

    constructor(problemDetail: ProblemDetail) {
        super(problemDetail.detail);
        this.name = 'ProblemDetailError';
        this.type = problemDetail.type;
        this.title = problemDetail.title;
        this.status = problemDetail.status;
        this.detail = problemDetail.detail;
        this.instance = problemDetail.instance;
        this.errors = problemDetail.errors;
    }
}

export type ProblemDetail = {
    type: string;
    title: string;
    status: number;
    detail: string;
    instance: string;
    errors?: ProblemDetailErrors;
}

export type ProblemDetailErrors = {
    [key: string]: string[];
}

export const isProblemDetail = (value: any): value is ProblemDetail => {
    return (
        typeof value === 'object' &&
        value !== null &&
        value !== undefined &&
        'type' in value &&
        'title' in value &&
        'status' in value &&
        'detail' in value &&
        'instance' in value
        && (
            'errors' in value ?
            isProblemDetailErrors(value.errors) : true
        )
    );
}

export const isProblemDetailErrors = (value: any): value is ProblemDetailErrors => {
    return (
        typeof value === 'object' &&
        value !== null &&
        value !== undefined &&
        Object.values(value).every(errors => Array.isArray(errors))
    );
}

export function unknownErrorProblemDetail(): ProblemDetailError {
    return new ProblemDetailError({
        type: "error_desconocido",
        title: "Error desconocido",
        status: 500,
        detail: "Error desconocido",
        instance: "error_desconocido"
    });
}