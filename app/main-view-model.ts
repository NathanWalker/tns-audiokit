import {Observable} from 'data/observable';
// import { Audiokit } from 'nativescript-audiokit';
import { AudioPlot } from './audioplot';
import { Page } from 'ui/page';

export class HelloWorldModel extends Observable {
    public btnText: string;  
  // private audiokit: Audiokit;
    private _audioplot: AudioPlot;
    private _recording: boolean;  

  constructor(page: Page) {
      super();
      this.set('btnText', 'Record'); 
      this._audioplot = <AudioPlot>page.getViewById('audioplot');

    // this.audiokit = new Audiokit();
  }

  public toggleRecord() {
      this._recording = !this._recording;
      console.log('toggleRecord');  
      this.set('btnText', this._recording ? 'Stop' : 'Record');
      this._audioplot.toggleRecord();
  }  

  initPlot() {
    this._audioplot = new AudioPlot();
  }
}