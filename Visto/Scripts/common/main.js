define(["require", "exports", "libs/visto", "module"], function (require, exports, visto, package) {
    /**
     * Shows a confirm dialog box with with various buttons.
     */
    function confirm(title, message, buttons) {
        return Q.Promise(function (resolve) {
            var buttonCollection = [];
            if (buttons === 0 /* YesNoCancel */ || buttons === 1 /* YesNo */) {
                buttonCollection.push({
                    label: "Yes",
                    click: function (dialog) {
                        dialog.close();
                        resolve(2 /* Yes */);
                    }
                });
            }
            if (buttons === 0 /* YesNoCancel */ || buttons === 1 /* YesNo */) {
                buttonCollection.push({
                    label: "No",
                    click: function (dialog) {
                        dialog.close();
                        resolve(3 /* No */);
                    }
                });
            }
            if (buttons === 2 /* OkCancel */ || buttons === 3 /* Ok */) {
                buttonCollection.push({
                    label: "OK",
                    click: function (dialog) {
                        dialog.close();
                        resolve(0 /* Ok */);
                    }
                });
            }
            if (buttons === 0 /* YesNoCancel */ || buttons === 2 /* OkCancel */) {
                buttonCollection.push({
                    label: "Cancel",
                    click: function (dialog) {
                        dialog.close();
                        resolve(1 /* Cancel */);
                    }
                });
            }
            visto.showDialog(visto.getViewName(package, "dialogs/Confirm"), {
                title: title,
                message: message,
                buttons: buttonCollection
            }, function (view) {
                view.dialog.on('keydown', function (ev) {
                    if (ev.keyCode === $.ui.keyCode.ESCAPE && (buttons === 2 /* OkCancel */ || buttons === 0 /* YesNoCancel */)) {
                        view.close();
                        resolve(1 /* Cancel */);
                    }
                });
            });
        });
    }
    exports.confirm = confirm;
    ;
    (function (DialogResult) {
        DialogResult[DialogResult["Ok"] = 0] = "Ok";
        DialogResult[DialogResult["Cancel"] = 1] = "Cancel";
        DialogResult[DialogResult["Yes"] = 2] = "Yes";
        DialogResult[DialogResult["No"] = 3] = "No";
    })(exports.DialogResult || (exports.DialogResult = {}));
    var DialogResult = exports.DialogResult;
    (function (Buttons) {
        Buttons[Buttons["YesNoCancel"] = 0] = "YesNoCancel";
        Buttons[Buttons["YesNo"] = 1] = "YesNo";
        Buttons[Buttons["OkCancel"] = 2] = "OkCancel";
        Buttons[Buttons["Ok"] = 3] = "Ok";
    })(exports.Buttons || (exports.Buttons = {}));
    var Buttons = exports.Buttons;
    /**
     * Shows a progress bar in a dialog. The dialog can be controlled using the dialog instance in the completed callback.
     */
    function progressDialog(title) {
        return Q.Promise(function (resolve) {
            visto.showDialog(package, "dialogs/ProgressDialog", {
                title: title,
                resizable: false,
                draggable: true,
                dialogClass: "box no-close",
                modal: true,
                closeOnEscape: false
            }, function (view) {
                var progress = {
                    maximum: null,
                    value: 0,
                    setMaximum: function (maximum) {
                        progress.maximum = maximum;
                        progress.update();
                    },
                    setValue: function (value) {
                        progress.value = value;
                        progress.update();
                    },
                    close: function () {
                        view.dialog.dialog("close");
                    },
                    update: function () {
                        if (progress.maximum === null)
                            view.getElement("#body").html("...");
                        else
                            view.getElement("#body").html(progress.value + " / " + progress.maximum);
                    }
                };
                resolve(progress);
            });
        });
    }
    exports.progressDialog = progressDialog;
    ;
    ;
    /**
     * Shows an alert dialog box.
     */
    function alert(title, message) {
        return confirm(title, message, 3 /* Ok */);
    }
    exports.alert = alert;
    ;
    /**
     * Shows an prompt dialog box to enter a string value.
     */
    function prompt(title, message, defaultText) {
        return Q.Promise(function (resolve, reject) {
            var output = ko.observable(defaultText);
            visto.showDialog(package, "dialogs/Prompt", {
                message: message,
                output: output,
                title: title,
                buttons: [
                    {
                        label: "OK",
                        click: function (dialog) {
                            dialog.close();
                            resolve(output());
                        }
                    },
                    {
                        label: "Cancel",
                        click: function (dialog) {
                            dialog.close();
                            reject(null);
                        }
                    }
                ]
            }, function (view) {
                view.dialog.on('keyup', function (ev) {
                    if (ev.keyCode === $.ui.keyCode.ESCAPE) {
                        view.close();
                        reject(null);
                    }
                    else if (ev.keyCode === $.ui.keyCode.ENTER) {
                        view.close();
                        resolve(output());
                    }
                });
            });
        });
    }
    exports.prompt = prompt;
    ;
    /**
     * Shows a dialog with a list picker.
     */
    function listPicker(header, label, items, selectedItem, optionsText) {
        return Q.Promise(function (resolve, reject) {
            var observableSelectedItem = ko.observable(selectedItem);
            visto.showDialog(package, "dialogs/ListPicker", {
                title: header,
                label: label,
                selectedItem: selectedItem,
                items: items,
                optionsText: optionsText,
                buttons: [
                    {
                        label: "OK",
                        click: function (dialog) {
                            dialog.close();
                            resolve(observableSelectedItem());
                        }
                    },
                    {
                        label: "Cancel",
                        click: function (dialog) {
                            dialog.close();
                            reject(null);
                        }
                    }
                ]
            }, function (view) {
                view.dialog.on('keyup', function (ev) {
                    if (ev.keyCode === $.ui.keyCode.ESCAPE) {
                        view.dialog.dialog("close");
                        reject(null);
                    }
                    else if (ev.keyCode === $.ui.keyCode.ENTER) {
                        view.dialog.dialog("close");
                        resolve(observableSelectedItem());
                    }
                });
            });
        });
    }
    exports.listPicker = listPicker;
    ;
});
//# sourceMappingURL=main.js.map