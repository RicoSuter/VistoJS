import visto = require("libs/visto");

export class LanguageSelectorModel extends visto.ViewModel {
    language: KnockoutObservable<any>;
    supportedLanguages: string[];

    initialize() {
        this.language = ko.observable(this.context.language());
        this.supportedLanguages = this.context.supportedLanguages;

		this.subscribe(this.language, () => {
            this.context.setLanguage(this.language(), this.supportedLanguages);
        });

        this.subscribe(this.context.language, () => {
            this.language(this.context.language());
		});
	}
}