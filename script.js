const speechText =
    document.getElementById("speechText");

const startBtn =
    document.getElementById("startBtn");

const stopBtn =
    document.getElementById("stopBtn");

const analyzeBtn =
    document.getElementById("analyzeBtn");

const statusText =
    document.getElementById("statusText");

let recognition;

let startTime;

let endTime;


const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();

    recognition.lang = "en-US";

    recognition.continuous = true;

    recognition.interimResults = false;


    startBtn.onclick = function () {

        startTime = Date.now();

        recognition.start();

        statusText.innerText =
            "● Listening...";

        startBtn.innerText =
            "🎙️ Listening";

    };


    stopBtn.onclick = function () {

        recognition.stop();

        endTime = Date.now();

        statusText.innerText =
            "● Recording stopped";

        startBtn.innerText =
            "🎙️ Speak";

    };


    recognition.onresult = function(event) {

        let text = "";

        for (
            let i = event.resultIndex;
            i < event.results.length;
            i++
        ) {

            text +=
                event.results[i][0].transcript;

        }

        speechText.value +=
            text + " ";

    };


    recognition.onend = function () {

        startBtn.innerText =
            "🎙️ Speak";

    };


} else {

    statusText.innerText =
        "Speech recognition is not supported.";

}


analyzeBtn.onclick = async function () {

    const text =
        speechText.value.trim();


    if (text === "") {

        alert(
            "Please speak or enter some text."
        );

        return;

    }


    if (!startTime) {

        startTime = Date.now() - 60000;

    }


    if (!endTime) {

        endTime = Date.now();

    }


    const duration =
        (endTime - startTime) / 1000;


    analyzeBtn.innerText =
        "⏳ Analyzing...";


    try {

        const response =
            await fetch("/analyze", {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    text: text,

                    duration: duration

                })

            });


        const data =
            await response.json();


        if (data.error) {

            alert(data.error);

            return;

        }


        document.getElementById(
            "score"
        ).innerText =
            data.score;


        document.getElementById(
            "scoreText"
        ).innerText =
            "Good progress!";


        document.getElementById(
            "wordCount"
        ).innerText =
            data.word_count;


        document.getElementById(
            "sentenceCount"
        ).innerText =
            data.sentence_count;


        document.getElementById(
            "wpm"
        ).innerText =
            data.wpm;


        document.getElementById(
            "duration"
        ).innerText =
            data.duration + "s";


        document.getElementById(
            "sentiment"
        ).innerText =
            data.emoji + " " +
            data.sentiment;


        const fillers =
            document.getElementById(
                "fillers"
            );


        if (data.total_fillers === 0) {

            fillers.innerText =
                "✓ No fillers detected";

        } else {

            fillers.innerText = "";

            for (
                const word in data.fillers
            ) {

                fillers.innerHTML +=
                    word +
                    ": " +
                    data.fillers[word] +
                    " ";

            }

        }


        const keywords =
            document.getElementById(
                "keywords"
            );


        keywords.innerHTML = "";


        data.keywords.forEach(
            function(word) {

                keywords.innerHTML +=
                    `<span class="keyword">
                        ${word}
                    </span>`;

            }
        );

    }

    catch(error) {

        alert(
            "Unable to connect to Flask."
        );

        console.log(error);

    }


    analyzeBtn.innerText =
        "✨ Analyze";

};