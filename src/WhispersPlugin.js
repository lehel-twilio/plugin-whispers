import { FlexPlugin } from 'flex-plugin';
import { Actions } from "@twilio/flex-ui";

export default class WhispersPlugin extends FlexPlugin {
  name = 'WhispersPlugin';

  init(flex, manager) {
    const playAudio = (payload) => {
      const reservation = payload.task.sourceObject;
      const audioFile = payload.task.attributes.whisper;
      const sid = payload.task.sid;
      const isInboundTask = reservation.task.attributes.direction === 'inbound'
      const record = payload.task.attributes.record
      const recordFunction = payload.task.attributes.recordFunction
      if (!isInboundTask) return

      const audio = new Audio(audioFile)

      audio.play()
      audio.addEventListener('ended', () => {
        reservation.conference({
          ConferenceRecord: ( typeof record === 'undefined' || record === null ) ? 'false' : 'true',
          ConferenceRecordingStatusCallback: ( typeof recordFunction === 'undefined' || recordFunction === null ) ? '' : `${recordFunction}?task_sid=${sid}`,
          EndConferenceOnExit: 'true',
          EndConferenceOnCustomerExit: 'true',
        })
      }, false)
    }

    const routePayload = (payload, original) => {
      const isVoiceQueue = payload.task.taskChannelUniqueName === 'voice'
      const hasWhisper = payload.task.attributes.whisper !== undefined;
      if (isVoiceQueue && hasWhisper) {
        playAudio(payload)
      } else {
        original(payload)
      }
    }

    Actions.replaceAction('AcceptTask', (payload, original) => {
      routePayload(payload, original)
      return Promise().resolve()
    })
  }
}
