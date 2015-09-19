import visto = require("libs/visto");
export declare class ValidationViewModel extends visto.ViewModel {
    private originalValidationMessage;
    isValid: KnockoutComputed<boolean>;
    validationInitial: boolean;
    validationEnabled: KnockoutObservable<boolean>;
    validationError: KnockoutObservable<string>;
    validationErrors: KnockoutObservableArray<string>;
    initialize(parameters: visto.Parameters): void;
    validate(): void;
    /**
     * [Replaceable]
     */
    getValidationErrors(): string[];
}
