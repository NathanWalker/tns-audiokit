// export class AudioWrite {

//     public renderAudioAndWriteToFile(player: AKAudioPlayer, mixer: AKMixer, path: string) {
//       player.playFromToWhen(0, 0, 0);
//     // [self.engine pause];
//       AudioKit.stop();  
//       let audioDescription = mixer.avAudioNode.outputFormatForBus(0).streamDescription;
//     // AVAudioOutputNode *outputNode = self.engine.outputNode;
//     // AudioStreamBasicDescription const *audioDescription = [outputNode outputFormatForBus:0].streamDescription;
      
//     // NSString *path = [self filePath];
//     let audioFile = this.createAndSetupExtAudioFileWithASBDAndFilePath(audioDescription, path);
//     if (!audioFile)
//         return;
//     let asset = AVURLAsset.assetWithURL(self.file.url);
//     let duration = CMTimeGetSeconds(asset.duration);
//     NSUInteger lengthInFrames = duration * audioDescription->mSampleRate;
//     const NSUInteger kBufferLength = 4096;
//     AudioBufferList *bufferList = AEAllocateAndInitAudioBufferList(*audioDescription, kBufferLength);
//     AudioTimeStamp timeStamp;
//     memset (&timeStamp, 0, sizeof(timeStamp));
//     timeStamp.mFlags = kAudioTimeStampSampleTimeValid;
//     OSStatus status = noErr;
//     for (NSUInteger i = kBufferLength; i < lengthInFrames; i += kBufferLength) {
//         status = [self renderToBufferList:bufferList writeToFile:audioFile bufferLength:kBufferLength timeStamp:&timeStamp];
//         if (status != noErr)
//             break;
//     }
//     if (status == noErr && timeStamp.mSampleTime < lengthInFrames) {
//         NSUInteger restBufferLength = (NSUInteger) (lengthInFrames - timeStamp.mSampleTime);
//         AudioBufferList *restBufferList = AEAllocateAndInitAudioBufferList(*audioDescription, restBufferLength);
//         status = [self renderToBufferList:restBufferList writeToFile:audioFile bufferLength:restBufferLength timeStamp:&timeStamp];
//         AEFreeAudioBufferList(restBufferList);
//     }
//     AEFreeAudioBufferList(bufferList);
//     ExtAudioFileDispose(audioFile);
//     if (status != noErr) {
//       console.log("An error has occurred");
//     } else {
//       console.log("Finished writing to file at path:", path);
//     }
// }

// // - (NSString *)filePath {
// //     NSArray *documentsFolders =
// //             NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
// //     NSString *fileName = [NSString stringWithFormat:@"%@.m4a", [[NSUUID UUID] UUIDString]];
// //     NSString *path = [documentsFolders[0] stringByAppendingPathComponent:fileName];
// //     return path;
// // }

// public createAndSetupExtAudioFileWithASBD(audioDescription: AudioStreamBasicDescription
//                                           andFilePath:(NSString *)path {
//     AudioStreamBasicDescription destinationFormat;
//     memset(&destinationFormat, 0, sizeof(destinationFormat));
//     destinationFormat.mChannelsPerFrame = audioDescription->mChannelsPerFrame;
//     destinationFormat.mSampleRate = audioDescription->mSampleRate;
//     destinationFormat.mFormatID = kAudioFormatMPEG4AAC;
//     ExtAudioFileRef audioFile;
//     OSStatus status = ExtAudioFileCreateWithURL(
//             (__bridge CFURLRef) [NSURL fileURLWithPath:path],
//             kAudioFileM4AType,
//             &destinationFormat,
//             NULL,
//             kAudioFileFlags_EraseFile,
//             &audioFile
//     );
//     if (status != noErr) {
//         NSLog(@"Can not create ext audio file");
//         return nil;
//     }
//     UInt32 codecManufacturer = kAppleSoftwareAudioCodecManufacturer;
//     status = ExtAudioFileSetProperty(
//             audioFile, kExtAudioFileProperty_CodecManufacturer, sizeof(UInt32), &codecManufacturer
//     );
//     status = ExtAudioFileSetProperty(
//             audioFile, kExtAudioFileProperty_ClientDataFormat, sizeof(AudioStreamBasicDescription), audioDescription
//     );
//     status = ExtAudioFileWriteAsync(audioFile, 0, NULL);
//     if (status != noErr) {
//         NSLog(@"Can not setup ext audio file");
//         return nil;
//     }
//     return audioFile;
// }

//  public renderToBufferListWriteToFileBufferLengthTimeStamp(
//       bufferList,
//                    audioFile,
//                   bufferLength,
//                      timeStamp) {
//     this.clearBufferList(bufferList);
//     let outputUnit = AudioKit.output.avAudioNode;// self.engine.outputNode.audioUnit;
//     let status = AudioUnitRender(outputUnit, 0, timeStamp, 0, bufferLength, bufferList);
//     if (status != noErr) {
//         NSLog(@"Can not render audio unit");
//         return status;
//     }
//     timeStamp->mSampleTime += bufferLength;
//     status = ExtAudioFileWrite(audioFile, bufferLength, bufferList);
//     if (status != noErr)
//         NSLog(@"Can not write audio to file");
//     return status;
// }

//   public clearBufferList(bufferList: any) {
//     for (let bufferIndex = 0; bufferIndex < bufferList->mNumberBuffers; bufferIndex++) {
//         memset(bufferList->mBuffers[bufferIndex].mData, 0, bufferList->mBuffers[bufferIndex].mDataByteSize);
//     }
//   }
// }