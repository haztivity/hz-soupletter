"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright Davinchi. All Rights Reserved.
 */
var core_1 = require("@haztivity/core");
var wordfind_1 = require("./lib/wordfind");
require("./lib/wordfindgame");
var ColorHash = require("color-hash");
var HzSoupLetterResource = /** @class */ (function (_super) {
    __extends(HzSoupLetterResource, _super);
    /**
     * Componente de cabecera para haztivity.
     * @param _$
     * @param _EventEmitterFactory
     * @param _ScormService
     * @example
     * div(data-hz-component="HzHeader")
     *      h1(data-hz-header-title)
     */
    function HzSoupLetterResource(_$, _EventEmitterFactory, _ScormService, _NavigatorService) {
        var _this = _super.call(this, _$, _EventEmitterFactory) || this;
        _this._ScormService = _ScormService;
        _this._NavigatorService = _NavigatorService;
        return _this;
    }
    HzSoupLetterResource_1 = HzSoupLetterResource;
    HzSoupLetterResource.prototype.init = function (options, config) {
        this._options = options;
        this._config = config;
        this._colorHash = new ColorHash();
        this._founded = -1;
        // start a word find game
        this._$text = this._$element.find("[data-hz-soup-letter-left]");
        this._$solveBtn = this._$element.find("[data-hz-soup-letter-solve]");
        this._id = options.scormId;
        this._onWordFounded({
            data: {
                instance: this
            }
        });
        this._gamePuzzle = wordfindgame.create(this._options.words, this._$element.find("[data-hz-soup-letter-board]"), this._$element.find("[data-hz-soup-letter-list]"), this._options, this._colorHash);
        // create just a puzzle, without filling in the blanks and print to console
        var puzzle = wordfind_1.wordfind.newPuzzle(this._options.words, { height: 18, width: 18, fillBlanks: false });
        wordfind_1.wordfind.print(this._gamePuzzle);
        this._assignEvents();
        this._initScorm();
    };
    HzSoupLetterResource.prototype._initScorm = function () {
        if (this._id != undefined) {
            this._ScormService.doLMSInitialize();
            if (this._ScormService.LMSIsInitialized()) {
                var objectiveIndex = this._findObjectiveIndex(this._id);
                if (objectiveIndex == -1) {
                    objectiveIndex = this._registerObjective();
                }
                this._objectiveIndex = objectiveIndex;
            }
        }
    };
    HzSoupLetterResource.prototype._registerObjective = function () {
        if (this._id != undefined) {
            var objectives = parseInt(this._ScormService.doLMSGetValue("cmi.objectives._count")), currentObjective = objectives;
            this._ScormService.doLMSSetValue("cmi.objectives." + currentObjective + ".id", instance._id);
            this._ScormService.doLMSSetValue("cmi.objectives." + currentObjective + ".status", "not attempted");
            this._ScormService.doLMSCommit();
            return currentObjective;
        }
    };
    HzSoupLetterResource.prototype._findObjectiveIndex = function (id) {
        var objectives = parseInt(this._ScormService.doLMSGetValue("cmi.objectives._count")), index = -1;
        for (var objectiveIndex = 0; objectiveIndex < objectives; objectiveIndex++) {
            var objective = "cmi.objectives." + objectiveIndex, objectiveId = this._ScormService.doLMSGetValue(objective + ".id");
            //se busca el objetivo de la actividad actual
            if (objectiveId === id) {
                index = objectiveIndex;
                objectiveIndex = objectives;
            }
        }
        return index;
    };
    HzSoupLetterResource.prototype._assignEvents = function () {
        var board = this._$element.find("[data-hz-soup-letter-board]");
        this._$solveBtn.on("click", this._solve.bind(this));
        board.off(HzSoupLetterResource_1.NAMESPACE)
            .on("found" + "." + HzSoupLetterResource_1.NAMESPACE, { instance: this }, this._onWordFounded)
            .one("end" + "." + HzSoupLetterResource_1.NAMESPACE, { instance: this }, this._onEnd);
    };
    HzSoupLetterResource.prototype._solve = function () {
        wordfindgame.solve(this._gamePuzzle, this._options.words, this._$element.find("[data-hz-soup-letter-list] ul"), this._colorHash);
    };
    HzSoupLetterResource.prototype._onEnd = function (e) {
        var instance = e.data.instance;
        instance._NavigatorService.enable();
        instance._markAsCompleted();
        if (instance._ScormService.LMSIsInitialized() && this._id != undefined) {
            instance._ScormService.doLMSSetValue("cmi.objectives." + instance._objectiveIndex + ".id", instance._id);
            instance._ScormService.doLMSSetValue("cmi.objectives." + instance._objectiveIndex + ".status", "passed");
            instance._ScormService.doLMSSetValue("cmi.objectives." + instance._objectiveIndex + ".score.raw", 100);
            instance._ScormService.doLMSCommit();
        }
    };
    HzSoupLetterResource.prototype._onWordFounded = function (e) {
        var instance = e.data.instance;
        instance._founded++;
        instance._$text.text("Quedan " + (instance._options.words.length - instance._founded) + " palabra/s");
    };
    HzSoupLetterResource.NAMESPACE = "hzSoupLetter";
    HzSoupLetterResource = HzSoupLetterResource_1 = __decorate([
        core_1.Resource({
            name: "HzSoupLetter",
            dependencies: [
                core_1.$,
                core_1.EventEmitterFactory,
                core_1.ScormService,
                core_1.NavigatorService
            ]
        })
    ], HzSoupLetterResource);
    return HzSoupLetterResource;
    var HzSoupLetterResource_1;
}(core_1.ResourceController));
exports.HzSoupLetterResource = HzSoupLetterResource;
//# sourceMappingURL=HzSoupLetterResource.js.map