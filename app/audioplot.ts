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

  // control nodes  
  private _audioPlotView: AudioPlot;  
  private _mic: AKMicrophone;  
  private _micBooster: AKBooster;
  private _recorder: AKNodeRecorder;
  private _player: AKAudioPlayer;

  // effects
  private _moogLadder: AKMoogLadder;
  private _reverb: AKReverb;
  private _reverbCostello: AKCostelloReverb;

  // mixers
  private _micMixer: AKMixer;  
  private _mainMixer: AKMixer;

  // state
  private _state: number = RecordState.readyToRecord;

  constructor(view: AudioPlot) {
    super();
    this._audioPlotView = view;

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
   
    this._mic = AKMicrophone.alloc().init();

    this._micMixer = AKMixer.alloc().init();   
    this._micMixer.connect(this._mic);

    this._micBooster = AKBooster.alloc().initGain(this._micMixer, 0);

    try {
      
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
              console.log('AKAudioPlayer completed playback.');
              this._state = RecordState.readyToPlay;
              this._audioPlotView.notify({
                eventName: 'completed',
                object: this._audioPlotView
              })
            }
          );
    } catch (err) {
      console.log('AKAudioPlayer init fail:', err);
    }
      
    // this._moogLadder = AKMoogLadder.alloc().initCutoffFrequencyResonance(this._player, 300, .6);
    // console.log('this._moogLadder:', this._moogLadder);    

    this._reverb = AKReverb.alloc().initDryWetMix(this._player, .5);
    // this._reverbCostello = AKCostelloReverb.alloc().initFeedbackCutoffFrequency(this._player, .92, 9900);
    
    this._mainMixer = AKMixer.alloc().init();
    console.log('this._mainMixer:', this._mainMixer);     
    // this._mainMixer.connect(this._moogLadder);
    this._mainMixer.connect(this._reverb);
    // this._mainMixer.connect(this._reverbCostello);
    this._mainMixer.connect(this._micBooster); 
    console.log('this._mainMixer:', this._mainMixer.avAudioNode);  
    let inputs = AudioKit.availableInputs;
    console.log('AudioKit.availableInputs:', inputs);  
    let outputs = AudioKit.availableOutputs;
    console.log('AudioKit.availableOutputs:', outputs);   

    // Will see null output here    
    // console.log('AudioKit.output:', AudioKit.output);    
    // console.log('this._mainMixer:', this._mainMixer);     

    // THIS CRASHES :( --------
    // If you uncomment the following 2 lines, app will crash when trying
    // to use the output setter....
    // AudioKit.output = this._mainMixer;
    // AudioKit.start();

    // THIS WORKS ---------
    // It uses the Swift output setter internally in this function
    AudioKit.auditionTestWithNodeDuration(this._mainMixer, .1);  
    console.log('AudioKit.output:', AudioKit.output);   

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

  public set moogFreq(value: number) {
    if (this._moogLadder) this._moogLadder.cutoffFrequency = value;
  }

  public set moogRes(value: number) {
    if (this._moogLadder) this._moogLadder.resonance = value;
  }

  public set reverb(value: number) {
    if (this._reverb) this._reverb.dryWetMix = value;
  }

  public set micVolume(value: number) {
    if (this._micBooster) this._micBooster.gain = value;
  }

  public toggleRecord() {
    if (this._state !== RecordState.recording) {
      this._state = RecordState.readyToRecord;
      // resetting (clear previous recordings)
      if (this._recorder)
        this._recorder.resetAndReturnError();  
    }
    switch (this._state) {
      case RecordState.readyToRecord:
        this._state = RecordState.recording;
        console.log('AKSettings.headPhonesPlugged:', AKSettings.headPhonesPlugged);
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
      this._state = RecordState.playing;
      console.log('this._player.currentTime:', this._player.currentTime);

      if (this._player.currentTime === 0 || this._player.currentTime === this._player.duration) {
        // if at beginning or end, replay
        this._player.playFromToWhen(0, 0, 0);
      } else {
        // just resume
        this._player.resume();
      }
    } else if (this._state === RecordState.playing) {
      this._state = RecordState.readyToPlay;
      this._player.pause();
    } 
  }  

  public save() {
    return new Promise((resolve, reject) => {
      let filePath = documentsPath(`recording-${Date.now()}.caf`);
        console.log('filePath:', filePath);  
        let fileUrl = NSURL.fileURLWithPath(filePath);
      console.log('fileUrl:', fileUrl);    
      let recordOptions = NSMutableDictionary.alloc().init();

      recordOptions.setValueForKey(NSNumber.numberWithInt(kAudioFormatLinearPCM), 'AVFormatIDKey');
      // recordOptions.setValueForKey(NSNumber.numberWithInt(AVAudioQuality.Medium), 'AVEncoderAudioQualityKey');
      recordOptions.setValueForKey(NSNumber.numberWithFloat(44100), 'AVSampleRateKey');
      recordOptions.setValueForKey(NSNumber.numberWithInt(2), 'AVNumberOfChannelsKey');
      // recordOptions.setValueForKey(NSNumber.numberWithInt(16), 'AVLinearPCMBitDepthKey');
      // recordOptions.setValueForKey(NSNumber.numberWithBool(false), 'AVLinearPCMIsBigEndianKey');
      // recordOptions.setValueForKey(NSNumber.numberWithBool(false), 'AVLinearPCMIsFloatKey');

      // m4a
      // recordOptions.setValueForKey(NSNumber.numberWithInt(kAudioFormatMPEG4AAC), 'AVFormatIDKey');
      // recordOptions.setValueForKey(NSNumber.numberWithInt(AVAudioQuality.Medium), 'AVEncoderAudioQualityKey');
      // recordOptions.setValueForKey(NSNumber.numberWithFloat(16000), 'AVSampleRateKey');
      // recordOptions.setValueForKey(NSNumber.numberWithInt(1), 'AVNumberOfChannelsKey');


      ///*** manually setting up export async from audiokit swift extension */
      // This does NOT work since ExportFactory singleton from AudioKit is not exposed
      // let asset = new AVURLAsset({ URL: fileUrl, options: null });  
      
      // console.log('asset:', asset);
      // let internalExportSession = new AVAssetExportSession({ asset: asset, presetName: AVAssetExportPresetAppleM4A });
      // console.log('internalExportSession:', internalExportSession);
      // if (internalExportSession) {

      //   internalExportSession.outputURL = fileUrl;
      //   internalExportSession.outputFileType = AVFileTypeAppleM4A;
        
      //   // let startTime = CMTimeMake(inFrame, Int32(sampleRate))
      //   // let stopTime = CMTimeMake(outFrame, Int32(sampleRate))
      //   // let timeRange = CMTimeRangeFromTimeToTime(startTime, stopTime)
      //   // internalExportSession.timeRange = timeRange

      //   // let session = ExportSession(AVAssetExportSession: internalExportSession, callback: callback)

      //   // ExportFactory.queueExportSession(session: session)
      // }



 /// *** works to write the file but doesn't play back the file if you open it in Finder and play it back ***///  
      let outputFile = AKAudioFile.alloc().initForWritingSettingsError(fileUrl, <any>recordOptions);
      console.log('outputFile:', outputFile);  
      console.log('processingFormat:', this._player.audioFile.processingFormat);
      
      this._player.avAudioNode.installTapOnBusBufferSizeFormatBlock(
        0,
        8192 /* this 8192 value is random, not sure what it should be? */, this._player.avAudioNode.inputFormatForBus(0),
        (buffer: AVAudioPCMBuffer, time: AVAudioTime) => {

        console.log('Buffer Size:',buffer);
        console.log('when:',time.sampleTime);
        console.log('outputfile length:',outputFile.length);
        console.log('input file length:',this._player.audioFile.length);
        if (outputFile.length < this._player.audioFile.length) {
              let errorRef = new interop.Reference();
              let writeErr = outputFile.writeFromBufferError(buffer);
              console.log('writeErr:', writeErr);
        } else {
          this._player.avAudioNode.removeTapOnBus(0);
          console.log('removed tap!');
          console.log('wrote file:', filePath); 
          resolve();
        }
      });



    });
  }
}

export class AudioPlot extends View {
  private _ios: AKNodeOutputPlot;
  private _recordModel: RecordModel;

  constructor() {
    super();
    console.log('AudioPlot constructor');
    this._recordModel = new RecordModel(this);
    console.log('AudioPlot _recordModel:', this._recordModel);
    this._ios = AKNodeOutputPlot.alloc().initFrameBufferSize(this._recordModel.mic, CGRectMake(0, 0, 0, 0), 50);
      
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

  set moogFreq(value: number) {
    this._recordModel.moogFreq = value;
  }

  set moogRes(value: number) {
    this._recordModel.moogRes = value;
  }

  set reverb(value: number) {
    this._recordModel.reverb = value;
  }

  set micVolume(value: number) {
    this._recordModel.micVolume = value;
  }

  public toggleRecord() {
      this._recordModel.toggleRecord();
  }
  
  public togglePlay() {
      this._recordModel.togglePlay();
  }

  public save() {
    this._recordModel.save().then(() => {
      console.log('saved file!');
    });
  }

  onLoaded() {
    super.onLoaded();
    console.log('AudioPlot onLoaded:', this._ios);
  }
}

const documentsPath = function(filename: string) {
  return `${knownFolders.documents().path}/${filename}`;
}