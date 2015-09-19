import visto = require("libs/visto");
import validationViewModel = require("./viewModels/ValidationViewModel");

export function isFormValid(formElement: JQuery) {
    var children = getFormViewChildren(formElement);
    return isFormValidInternal(formElement, children);
}

export function isFormValidComputable(formElement: JQuery) {
    var children = getFormViewChildren(formElement);
    return ko.computed<boolean>(() => {
        return isFormValidInternal(formElement, children);
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

function getFormViewChildren(formElement: JQuery) {
    var parentView = visto.getViewFromElement(formElement);
    if (parentView !== undefined && parentView !== null)
        return parentView.viewChildren; 
    return ko.observableArray<visto.ViewBase>();
}