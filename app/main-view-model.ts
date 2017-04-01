import {Observable} from 'data/observable';
// import { Audiokit } from 'nativescript-audiokit';
import { AudioPlot } from './audioplot';
import { Page } from 'ui/page';

export class HelloWorldModel extends Observable {
    public btnText: string = '';
    public playBtnText: string = '';

  // private audiokit: Audiokit;
    private _audioplot: AudioPlot;
    private _recording: boolean;  
    private _playing: boolean;

  constructor(page: Page) {
      super();

      this.set('micVolume', 0);
      this.set('btnText', 'Record'); 
      this.set('playBtnText', 'Play');
      this.set('moogFreq', 300);
      this.set('moogRes', .6);
      this.set('reverb', .5);
      this._audioplot = <AudioPlot>page.getViewById('audioplot');

      this._audioplot.on('completed', () => {
          console.log('view completed playing - updating playbtn.');
          this._playing = false;
          this.updatePlayBtn();
      });

      this.on(Observable.propertyChangeEvent, (args:any) => {
          if (args) {
              switch (args.propertyName) {
                  case 'micVolume':
                      this._audioplot.micVolume = args.value;
                      break;
                  case 'moogFreq':
                    this._audioplot.moogFreq = args.value;
                    break;  
                  case 'moogRes':
                      this._audioplot.moogRes = args.value;
                      break;
                  case 'reverb':
                      this._audioplot.reverb = args.value;
                      break;
              }   
          } 
      });
  }

  public toggleRecord() {
      this._recording = !this._recording;
      console.log('toggleRecord');  
      this.updateRecordBtn();
      this._audioplot.toggleRecord();
  }  

  public togglePlay() {
    this._playing = !this._playing;
    console.log('togglePlay');  
    this.updatePlayBtn();
    this._audioplot.togglePlay();
  }

  public save() {
      this._audioplot.save();
  }  

  private updateRecordBtn() {
    this.set('btnText', this._recording ? 'Stop' : 'Record');
  }  

  private updatePlayBtn() {
      console.log('notifying prop change playBtnText, playing:', this._playing);
      this.set('playBtnText', this._playing ? 'Stop' : 'Play');
  }  
}