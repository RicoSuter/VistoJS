import visto = require("libs/visto");

export class LanguageSelectorModel extends visto.ViewModel {
	language = ko.observable(visto.language());
	supportedLanguages = visto.supportedLanguages;

	initialize() {
		this.subscribe(this.language, () => {
			visto.setLanguage(this.language(), this.supportedLanguages, true);
		});
		this.subscribe(visto.language, () => {
			this.language(visto.language());
		});
	}
}