import { ClientFactory, Controller, DataChannel } from "thor-io.client-vnext";
import { AppDomain } from "../AppDomain";
import { DOMUtils } from "../Helpers/DOMUtils";
import { UserSettings } from '../UserSettings';
import { AppComponent } from './AppComponent';
import { Transcriber } from "../Audio/Transcriber";
import { JournalComponent } from "./JournalComponent";

export interface IChatAIResponse {
    id: string
    choices: [{
        text: string;
    }],
    errors:[]
}
export class ChatComponent extends AppComponent {
    onChatMessage: (args: any) => void
    chatMessage?: HTMLInputElement;
    language: string;
    controller: Controller;
  
    constructor(public dc: DataChannel,        
        public journal: JournalComponent,
        public userSettings: UserSettings) {
        super();
        this.language = UserSettings.language;

       // this.controller = this.clientFactory.getController("broker") as Controller;

        // this.controller.on("askAI", (r: IChatAIResponse) => {           
        //     this.sendMessage("AI", r.choices[0].text + "{}")                      
        // });

        
        this.dc.on("chatMessage", (data: any) => {

            if (this.onChatMessage) this.onChatMessage(data);       
            journal.add(data.from,data.text,data.text,"en");
            this.render(data);

        });

        this.chatMessage = DOMUtils.get<HTMLInputElement>("#chat-message")

        DOMUtils.on("keydown", this.chatMessage, (e) => {
            if (e.keyCode == 13) {

                let text = this.chatMessage.value;

                console.log(text,text.startsWith("@ai"));

                if(text.startsWith("@ai")){

                    console.log("asking ai",text);

                    this.controller.invoke("askAI", {
                        prompt: text.replace("@ai","")
                    });

                 
                    
                }else                     
                this.sendMessage(UserSettings.nickname, text)
               

                this.chatMessage.value = "";
            }
        });
      
        
    }


    sendMessage(sender: string, message: string) {
        const data = {
            text: message,
            from: sender,
            language: this.language || navigator.languages[0]
        }        
        
        this.dc.invoke("chatMessage", data);
        this.journal.add(data.from,data.text,data.text,"en");
        this.render(data);
    }
    render(msg: any) {
        
        let chatMessages = DOMUtils.get("#chat-messages");


        if (this.language != msg.language) {
            Transcriber.translateCaptions(AppDomain.translateKey, msg.text, msg.language, this.language).then(translate => {
                let translated = DOMUtils.makeLink(translate);
                let template = `<div>
                    <mark>${msg.from}</mark>
                    <time>(${(new Date()).toLocaleTimeString().substring(0, 5)})</time>
                    <span>${translated}<i class="ml-3 text-muted chat-translation">${msg.text}</i></span>
                    </div>`
                chatMessages.prepend(DOMUtils.toDOM(template));
            }).catch( err => {
                let template = `<div>
                <mark>${msg.from}</mark>
                <time>(${(new Date()).toLocaleTimeString().substring(0, 5)})</time>
                <span>${DOMUtils.makeLink(msg.text)}</span>
                </div>`
                   chatMessages.prepend(DOMUtils.toDOM(template));
            });

        } else {
            let template = `<div>
                <mark>${msg.from}</mark>
                <time>(${(new Date()).toLocaleTimeString().substring(0, 5)})</time>
                <span>${DOMUtils.makeLink(msg.text)}</span>
                </div>`
            chatMessages.prepend(DOMUtils.toDOM(template));
        }
    }

}