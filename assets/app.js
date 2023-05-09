(function(d, video, button, instruction, text) {
    const options = {
        iceServers: [{
            urls: ['stun:stun1.1.google.com:19302', 'stun:stun2.1.google.com:19302']
        }]
    };
    const pc = new RTCPeerConnection(options);
    
    let localStream, remoteStream;

    const onClick = e => {
        const target = e.target.dataset.target;

        switch(e.target.dataset.target) {
            case "reset":
                d.location.reload();
                break;
            case "sdp-offer":
                makeOffer();
                break;
            case "sdp-answer":
                makeAnswer();
                break;
            case "sdp-confirm":
                confirmAnswer();
                break;
            default:
                const person1 = target;
                const person2 = target === 'caller' ? 'recipient' : 'caller';

                d.querySelectorAll(`.${button}`).forEach($el => {
                    if ($el.dataset.target === person1) {
                        $el.disabled = true
                    } else if ($el.dataset.target === person2) {
                        $el.remove();
                    }
                });

                d.querySelectorAll(`.${instruction}`).forEach($el => {
                    if ($el.dataset.target === target) {$el.style.display = 'block'}
                    else {$el.remove();}
                });
                initWebRTC(target);
        }
    };
    const initUI = async () => {
        const copy = e => {
            navigator.clipboard.writeText(e.target.value);
            window.alert('copied to clipboard!');
        }

        d.querySelectorAll(`.${button}`).forEach($el => $el.addEventListener('click', onClick));
        d.querySelectorAll(`.${text}`).forEach($el => {
            if ($el.dataset.copy) {
                $el.addEventListener('click', copy);
            }
        });
    };

    const initWebRTC = async (target) => {
        if (!localStream || !remoteStream) {
            localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:true});
            remoteStream = new MediaStream();

            localStream.getTracks().forEach((track) => {
                pc.addTrack(track, localStream);
            });

            pc.ontrack = e => {
                e.streams[0].getTracks().forEach((track) => {
                    remoteStream.addTrack(track);
                });
            };
        }

        d.querySelectorAll(`.${video}`).forEach($el => {
            $el.srcObject = $el.dataset.target === target ? localStream : remoteStream;
        });
    };

    const makeOffer = async () => {
        pc.onicecandidate = async (e) => {
            if (e.candidate) {
                d.querySelector(`.${text}[data-target="sdp-offer"]`).value = JSON.stringify(pc.localDescription);
            }
        };

        const offer = await pc.createOffer();

        await pc.setLocalDescription(offer);
    };

    const makeAnswer = async () => {
        const offer = JSON.parse(d.querySelector(`.${text}[data-target="sdp-offer"]`).value);

        pc.onicecandidate = async (e) => {
            if (e.candidate) {
                d.querySelector(`.${text}[data-target="sdp-answer"]`).value = JSON.stringify(pc.localDescription);
            }
        };

        await pc.setRemoteDescription(offer);

        const answer = await pc.createAnswer();

        await pc.setLocalDescription(answer); 
    };

    const confirmAnswer = async () => {
        const answer = JSON.parse(d.querySelector(`.${text}[data-target="sdp-answer"]`).value);

        if (!pc.currentRemoteDescription) {
            pc.setRemoteDescription(answer);
        }
    };

    initUI();
    initWebRTC();
})(window.document, 'js-video', 'js-button', 'js-instruction', 'js-textarea');
