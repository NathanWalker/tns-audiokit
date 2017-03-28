import { Observable } from 'data/observable';
import { View } from 'ui/core/view';
import { Color } from 'color';
import { knownFolders } from 'file-system';

enum RecordState {
  readyToRecord,
  recording,
  readyToPlay,
  playing
}

export class RecordModel extends Observable {

  private _mic: AKMicrophone;  
  private _micBooster: AKBooster;
  private _recorder: AKNodeRecorder;
  private _player: AKAudioPlayer;
  private _moogLadder: AKMoogLadder;
  private _micMixer: AKMixer;  
  private _mainMixer: AKMixer;
  private _state: number = RecordState.readyToRecord;

  constructor() {
    super();

    console.log('AKSettings', AKSettings); 
    console.log('AKSettings.bufferLength', AKSettings.bufferLength);  
    console.log('BufferLength.Medium', BufferLength.Medium);    
    // audio setup 
    // CRASH  
    // AKSettings.bufferLength = BufferLength.Medium;
    // console.log('AKSettings.bufferLength', AKSettings.bufferLength);   

    try {
      console.log('AKSettings.setSessionWithCategoryOptionsError', AKSettings.setSessionWithCategoryOptionsError);   
      let setSession = AKSettings.setSessionWithCategoryOptionsError(SessionCategory.PlayAndRecord, AVAudioSessionCategoryOptions.DefaultToSpeaker);
      console.log('category session is set:', setSession);  
    } catch (err) {
      console.log(err);
    }

    console.log('AKMicrophone', AKMicrophone);    
    this._mic = AKMicrophone.alloc().init();
    console.log('this._mic:', this._mic);    
    this._micMixer = AKMixer.alloc().init();
    console.log('micMixer:', this._micMixer);    
    this._micMixer.connect(this._mic);

    // this._micBooster = new AKBooster(<any>{ input: micMixer, gain: 0 });
    // console.log('this._micBooster.initGain:', this._micBooster.initGain);  
    this._micBooster = AKBooster.alloc().initGain(this._micMixer, 0);
    console.log('this._micBooster:', this._micBooster);  
    // this._micBooster.initGain(micMixer, 0);

    try {
      //   let filePath = documentsPath(`recording-${Date.now()}.m4a`);
      //   console.log('filePath:', filePath);  
      //   let fileUrl = NSURL.fileURLWithPath(filePath);
      // console.log('fileUrl:', fileUrl);    
      // let recordOptions = NSMutableDictionary.alloc().init();
      // recordOptions.setValueForKey(NSNumber.numberWithInt(kAudioFormatMPEG4AAC), 'AVFormatIDKey');
      // // recordOptions.setValueForKey(NSNumber.numberWithInt(AVAudioQuality.Medium), 'AVEncoderAudioQualityKey');
      // recordOptions.setValueForKey(NSNumber.numberWithFloat(16000), 'AVSampleRateKey');
      // recordOptions.setValueForKey(NSNumber.numberWithInt(1), 'AVNumberOfChannelsKey');
      // let file = AKAudioFile.alloc().initForWritingSettingsError(fileUrl, <any>recordOptions);
      // console.log('file:', file);  
      // file.initForWritingSettingsError(fileUrl, <any>recordOptions);
      this._recorder = AKNodeRecorder.alloc().initWithNodeFileError(this._micMixer, null);
      console.log('this._recorder:', this._recorder);    
    } catch (err) {
      console.log(err);
    }

    try {
      let errorRef = new interop.Reference();
      this._player = AKAudioPlayer.alloc()
          .initWithFileLoopingErrorCompletionHandler(
            this._recorder.audioFile, false, <any>errorRef, () => {
              console.log('AKAudioPlayer created');
            }
          );
    } catch (err) {
      console.log('AKAudioPlayer init fail:', err);
    }

    console.log('AKMoogLadder:', AKMoogLadder);        
    this._moogLadder = AKMoogLadder.alloc().initCutoffFrequencyResonance(this._player, 1, 0);
    console.log('this._moogLadder:', this._moogLadder);    
    // this._moogLadder.initCutoffFrequencyResonance(this._player, 1, 0);
    
    this._mainMixer = AKMixer.alloc().init();
    console.log('this._mainMixer:', this._mainMixer);     
    this._mainMixer.connect(this._moogLadder);
    this._mainMixer.connect(this._micBooster); 
    console.log('this._mainMixer:', this._mainMixer.avAudioNode);  
    let inputs = AudioKit.availableInputs;
    console.log('AudioKit.availableInputs:', inputs);  
    let outputs = AudioKit.availableOutputs;
    console.log('AudioKit.availableOutputs:', outputs);   

    // Will see null output here    
    console.log('AudioKit.output:', AudioKit.output);    
    // console.log('this._mainMixer:', this._mainMixer);     

    // THIS CRASHES :( --------
    // If you uncomment the following 2 lines, app will crash when trying
    // to use the output setter....
    // AudioKit.output = this._mainMixer;
    // AudioKit.start();

    // THIS WORKS ---------
    // It uses the Swift output setter internally in this function
    AudioKit.auditionTestWithNodeDuration(this._mainMixer, .1);    

    // will see this in the log if no crash above occurs
    console.log('audiokit start!');  
  }    

  public get mic(): AKMicrophone {
    return this._mic;
  }

  public get state(): number {
      return this._state;
  }  

  public set state(value: number) {
      this._state = value;  
  }  

  public toggleRecord() {
    switch (this._state) {
      case RecordState.readyToRecord:
        this._state = RecordState.recording;
        if (AKSettings.headPhonesPlugged) {
            this._micBooster.gain = 1;
        }
        try {
            let r = this._recorder.recordAndReturnError();  
            console.log('recording:', r);
        } catch (err) {
            console.log('Recording failed:', err);  
        }  
        break;  
      case RecordState.recording:
          this._state = RecordState.readyToPlay;
          // Microphone monitoring is muted
          this._micBooster.gain = 0;
          try {
              this._player.reloadFileAndReturnError();
          } catch (err) {
              console.log('Player reload file failed:', err);
          }
          let recordedDuration = this._player ? this._player.duration : 0;
          console.log('recordedDuration:', recordedDuration);
          this._recorder.stop();
          console.log('this._player.audioFile:', this._player.audioFile); 
          console.log('this._player.audioFile.exportAsynchronously:', (<any>this._player.audioFile).exportAsynchronously);   
          break;  

    }  
  }  

  public togglePlay() {
      if (this._state === RecordState.readyToPlay) {
        
    }  
  }  
}

export class AudioPlot extends View {
  private _ios: AKNodeOutputPlot;
  private _recordModel: RecordModel;

  constructor() {
    super();
    console.log('AudioPlot constructor');
    this._recordModel = new RecordModel();
    console.log('AudioPlot _recordModel:', this._recordModel);
    this._ios = AKNodeOutputPlot.alloc().initFrameBufferSize(this._recordModel.mic, CGRectMake(0, 0, 0, 0), 10);
      
    console.log('AudioPlot AKNodeOutputPlot:', this._ios);
  }

  public get ios() {
      return this._ios;  
  }  

  public get _nativeView() {
      return this._ios;  
  }  

  set plotColor(value: string) {
    console.log(`AudioPlot color: ${value}`);
    this._ios.color = new Color(value).ios;
  }
  
  set fill(value: boolean) {
    console.log(`AudioPlot fill: ${value}`);
    this._ios.shouldFill = value;
  }
  
  set mirror(value: boolean) {
    console.log(`AudioPlot mirror: ${value}`);
    this._ios.shouldMirror = value;
  }
  
  set plotType(type: string) {
    console.log(`AudioPlot plotType: ${type}`);
    switch (type) {
      case 'buffer':
        this._ios.plotType = EZPlotType.Buffer;
        break;
      case 'rolling':
        this._ios.plotType = EZPlotType.Rolling;
        break;
    }
  }  

  public toggleRecord() {
      this._recordModel.toggleRecord();
  }  

  onLoaded() {
    super.onLoaded();
    console.log('AudioPlot onLoaded:', this._ios);
  }
}

const documentsPath = function(filename: string) {
  return `${knownFolders.documents().path}/${filename}`;
}