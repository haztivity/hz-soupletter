/**
 * @license
 * Copyright Davinchi. All Rights Reserved.
 */
import {Resource,ResourceController,$,EventEmitterFactory,ScormService,NavigatorService} from "@haztivity/core";
import {wordfind} from "./lib/wordfind";
import "./lib/wordfindgame";
import * as ColorHash from "color-hash";
@Resource(
    {
        name:"HzSoupLetter",
        dependencies:[
            $,
            EventEmitterFactory,
            ScormService,
            NavigatorService
        ]
    }
)
export class HzSoupLetterResource extends ResourceController{
    public static readonly NAMESPACE = "hzSoupLetter";
    /**
     * Componente de cabecera para haztivity.
     * @param _$
     * @param _EventEmitterFactory
     * @param _ScormService
     * @example
     * div(data-hz-component="HzHeader")
     *      h1(data-hz-header-title)
     */
    constructor(_$: JQueryStatic, _EventEmitterFactory,protected _ScormService:ScormService,protected _NavigatorService:NavigatorService) {
        super(_$, _EventEmitterFactory);
    }
    init(options, config?) {
        this._options = options;
        this._config = config;
        this._colorHash = new ColorHash();
        this._founded = -1;
        // start a word find game
        this._$text = this._$element.find("[data-hz-soup-letter-left]");
        this._$solveBtn = this._$element.find("[data-hz-soup-letter-solve]");
        this._id = options.scormId;
        this._onWordFounded({
            data:{
                instance:this
            }
        });
        this._gamePuzzle = wordfindgame.create(this._options.words, this._$element.find("[data-hz-soup-letter-board]"), this._$element.find("[data-hz-soup-letter-list]"),this._options,this._colorHash);
        // create just a puzzle, without filling in the blanks and print to console
        var puzzle = wordfind.newPuzzle(
            this._options.words,
            {height: 18, width:18, fillBlanks: false}
        );
        wordfind.print(this._gamePuzzle);
        this._assignEvents();
        this._initScorm();
    }
    protected _initScorm(){
        if(this._id != undefined) {
            this._ScormService.doLMSInitialize();
            if (this._ScormService.LMSIsInitialized()) {
                let objectiveIndex = this._findObjectiveIndex(this._id);
                if (objectiveIndex == -1) {
                    objectiveIndex = this._registerObjective();
                }
                this._objectiveIndex = objectiveIndex;
            }
        }
    }
    protected _registerObjective(){
        if(this._id != undefined) {
            let objectives = parseInt(this._ScormService.doLMSGetValue("cmi.objectives._count")),
                currentObjective = objectives;
            this._ScormService.doLMSSetValue(`cmi.objectives.${currentObjective}.id`, instance._id);
            this._ScormService.doLMSSetValue(`cmi.objectives.${currentObjective}.status`, "not attempted");
            this._ScormService.doLMSCommit();
            return currentObjective;
        }
    }
    protected _findObjectiveIndex(id){
        let objectives = parseInt(this._ScormService.doLMSGetValue("cmi.objectives._count")),
            index = -1;
        for (let objectiveIndex = 0; objectiveIndex < objectives; objectiveIndex++) {
            let objective = "cmi.objectives."+objectiveIndex,
                objectiveId = this._ScormService.doLMSGetValue(objective+".id");
            //se busca el objetivo de la actividad actual
            if(objectiveId === id){
                index = objectiveIndex;
                objectiveIndex = objectives;
            }
        }
        return index;
    }
    protected _assignEvents(){
        let board = this._$element.find("[data-hz-soup-letter-board]");
        this._$solveBtn.on("click",this._solve.bind(this));
        board.off(HzSoupLetterResource.NAMESPACE)
            .on("found"+"."+HzSoupLetterResource.NAMESPACE,{instance:this},this._onWordFounded)
            .one("end"+"."+HzSoupLetterResource.NAMESPACE,{instance:this},this._onEnd);
    }
    protected _solve(){
        wordfindgame.solve(this._gamePuzzle,this._options.words,this._$element.find("[data-hz-soup-letter-list] ul"),this._colorHash);
    }
    protected _onEnd(e){
        let instance = e.data.instance;
        instance._NavigatorService.enable();
        instance._markAsCompleted();
        if(instance._ScormService.LMSIsInitialized() && instance._id != undefined){
            instance._ScormService.doLMSSetValue(`cmi.objectives.${instance._objectiveIndex}.id`,instance._id);
            instance._ScormService.doLMSSetValue(`cmi.objectives.${instance._objectiveIndex}.status`,"passed");
            instance._ScormService.doLMSSetValue(`cmi.objectives.${instance._objectiveIndex}.score.raw`,100);
            instance._ScormService.doLMSCommit();
        }
    }
    protected _onWordFounded(e){
        let instance = e.data.instance;
        instance._founded++;
        instance._$text.text(`Quedan ${instance._options.words.length - instance._founded} palabra/s`);
    }
}