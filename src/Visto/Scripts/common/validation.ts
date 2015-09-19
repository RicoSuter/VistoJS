import visto = require("libs/visto");
import validationViewModel = require("./viewModels/ValidationViewModel");

export function isFormValid(view: visto.ViewBase, formElement: JQuery) {
    return isFormValidInternal(formElement, view.viewChildren);
}

export function isFormValidComputable(view: visto.ViewBase, formElement: JQuery) {
    return ko.computed<boolean>(() => {
        var isViewLoaded = view.isViewLoaded();
        var isFormValid = isFormValidInternal(formElement, view.viewChildren);
        return isViewLoaded && isFormValid;
    });
}

function isFormValidInternal(formElement: JQuery, children: KnockoutObservableArray<visto.ViewBase>) {
    var isFormValid = true;
    for (var viewModel of getInputViewModelsWithValidation(formElement, children)) {
        var isValid = viewModel.isValid();
        if (!isValid)
            isFormValid = false;
    }
    return isFormValid;
}

function getInputViewModelsWithValidation(formElement: JQuery, children: KnockoutObservableArray<visto.ViewBase>) {
    var inputViewModels: validationViewModel.ValidationViewModel[] = [];
    for (var viewChild of children()) {
        var viewElement = (<any>viewChild).element;
        var viewModel = (<any>viewChild).viewModel;

        if (formElement.find(viewElement).length > 0) {
            if (viewModel !== undefined && viewModel !== null && viewModel.isValid !== undefined)
                inputViewModels.push(viewModel);
        }
    }
    return inputViewModels;
}