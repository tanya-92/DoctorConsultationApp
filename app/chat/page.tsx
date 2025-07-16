"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Send,
  Paperclip,
  ImageIcon,
  Video,
  Phone,
  User,
  Clock,
  Stethoscope,
  AlertCircle,
  MessageCircle,
} from "lucide-react"
import { useTheme } from "next-themes"
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";



export default function LiveChat() {
  const [chatStarted, setChatStarted] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [roomId, setRoomId] = useState("");

  const doctorQuickReplies = [
  "How can I help you?",
  "Please elaborate your symptoms.",
  "I’ll prescribe you a medicine.",
  "Thank you for your time.",
  "Do you have any allergies?",
  ];
  const patientQuickReplies = [
  "I have a skin issue.",
  "Since last week...",
  "Thank you, Doctor.",
  "Yes, I have an allergy.",
  "What should I apply?",
  ];
  const currentQuickReplies =
  currentUser?.email === "drnitinmishraderma@gmail.com" ? doctorQuickReplies : patientQuickReplies;
  
  const handlePreFormSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setChatStarted(true);

  setMessages((prev) => [
    ...prev,
    {
      id: prev.length + 1,
      sender: "system",
      text: `Hello ${preFormData.name}! Please wait until Dr. Nitin Mishra joins the chat.`,
      timestamp: new Date(),
    },
  ]);
};
  const handleInputChange = (field: string, value: string) => {
    setPreFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "age") {
      // Validate age input
      const age = parseInt(value, 10);
      if (isNaN(age) || age < 5 || age > 100) {
        setAgeError("Please enter a valid age between 5 and 100.");
      } else {
        setAgeError("");
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!message.trim() || !roomId || !currentUser?.email) return;
  const newMessage = {
    text: message,
    sender: currentUser.email,
    timestamp: serverTimestamp()
  };
  try {
    await addDoc(collection(db, "chats", roomId, "messages"), newMessage);
    setMessage(""); // clear input after sending
  } catch (err) {
    console.error("Error sending message: ", err);
  }
  };

    setMessages((prev) => [
    ...prev,
    {
      id: prev.length + 1,
      sender: "system",
      text: `Hello ${preFormData.name}! Please wait until Dr. Nitin Mishra joins the chat.`,
      timestamp: new Date(),
    },
  ]);
};
  const handleInputChange = (field: string, value: string) => {
    setPreFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "age") {
      // Validate age input
      const age = parseInt(value, 10);
      if (isNaN(age) || age < 5 || age > 100) {
        setAgeError("Please enter a valid age between 5 and 100.");
      } else {
        setAgeError("");
      }
    }
  };
  
  
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      setCurrentUser(user);

      const doctorEmail = "drnitinmishraderma@gmail.com"; 
      const id = `${user.email}_to_${doctorEmail}`;
      setRoomId(id);

      const messagesRef = collection(db, "chats", id, "messages");
      const q = query(messagesRef, orderBy("timestamp"));

      const unsubMessages = onSnapshot(q, (snapshot) => {
        setMessages(snapshot.docs.map((doc) => doc.data()));
      });

      return () => unsubMessages(); // clean up message listener
    }
  });

  return () => unsubscribe(); // clean up auth listener
}, []);


  const [preFormData, setPreFormData] = useState({
    name: "",
    age: "",
    gender: "",
    symptoms: "",
    contact: "",
    urgency: "",
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  // Add age validation state
  const [ageError, setAgeError] = useState("")

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  
  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  if (!chatStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-50 dark:bg-gray-800/80 dark:border-gray-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/">
                  <Button variant="ghost" size="sm" className="group">
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Home
                  </Button>
                </Link>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">Live Chat Consultation</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl dark:bg-gray-800/70 dark:border-gray-700">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl dark:text-gray-100">Start Live Chat with Dr. Nitin Mishra</CardTitle>
                <p className="text-gray-600 mt-2 dark:text-gray-400">
                  Please provide some basic information before connecting with the doctor
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePreFormSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name" className="dark:text-gray-100">
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      value={preFormData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                      className="bg-white/50 dark:bg-gray-700/50 dark:text-gray-100"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="age" className="dark:text-gray-100">
                        Age *
                      </Label>
                      <Input
                        id="age"
                        type="number"
                        value={preFormData.age}
                        onChange={(e) => handleInputChange("age", e.target.value)}
                        required
                        className="bg-white/50 dark:bg-gray-700/50 dark:text-gray-100"
                        min="5"
                        max="100"
                        placeholder="Your age"
                      />
                      {ageError && <p className="text-red-600 text-sm mt-1">{ageError}</p>}
                    </div>
                    <div>
                      <Label htmlFor="gender" className="dark:text-gray-100">
                        Gender *
                      </Label>
                      <Select value={preFormData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                        <SelectTrigger className="bg-white/50 dark:bg-gray-700/50">
                          <SelectValue placeholder="Select gender" className="dark:text-gray-100" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-700 dark:text-gray-100">
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="contact" className="dark:text-gray-100">
                      Contact Number *
                    </Label>
                    <Input
                      id="contact"
                      type="tel"
                      value={preFormData.contact}
                      onChange={(e) => handleInputChange("contact", e.target.value)}
                      required
                      className="bg-white/50 dark:bg-gray-700/50 dark:text-gray-100"
                      placeholder="9258924611"
                    />
                  </div>

                  <div>
                    <Label htmlFor="symptoms" className="dark:text-gray-100">
                      Symptoms / Chief Complaint *
                    </Label>
                    <Textarea
                      id="symptoms"
                      placeholder="Please describe your symptoms, skin condition, or reason for consultation in detail..."
                      value={preFormData.symptoms}
                      onChange={(e) => handleInputChange("symptoms", e.target.value)}
                      required
                      className="bg-white/50 min-h-[120px] dark:bg-gray-700/50 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <Label htmlFor="urgency" className="dark:text-gray-100">
                      Urgency Level *
                    </Label>
                    <Select value={preFormData.urgency} onValueChange={(value) => handleInputChange("urgency", value)}>
                      <SelectTrigger className="bg-white/50 dark:bg-gray-700/50">
                        <SelectValue placeholder="Select urgency level" className="dark:text-gray-100" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-700 dark:text-gray-100">
                        <SelectItem value="low">Low - General inquiry/routine consultation</SelectItem>
                        <SelectItem value="medium">Medium - Concerning symptoms</SelectItem>
                        <SelectItem value="high">High - Urgent consultation needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg dark:bg-gray-700">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 dark:text-blue-400" />
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-medium mb-1">Important Notes:</p>
                        <ul className="space-y-1">
                          <li>• Consultation fee: ₹500 (payable after consultation)</li>
                          <li>• Average wait time: 5-15 minutes</li>
                          <li>• You can upload images during the chat</li>
                          <li>• For emergencies, please call 9258924611 directly</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg dark:from-blue-400 dark:to-blue-400 dark:hover:from-blue-300 dark:hover:to-blue-300"
                    size="lg"
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Start Chat Consultation
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    {/* Header */}
    <header className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-50 dark:bg-gray-800/80 dark:border-gray-700">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/">
          <Button variant="ghost" size="sm" className="group">
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            End Chat
          </Button>
        </Link>
        <div className="text-sm text-green-600 dark:text-green-400 font-semibold">Live Chat Active</div>
      </div>
    </header>

    <div className="container mx-auto px-4 py-4 h-[calc(100vh-80px)] grid lg:grid-cols-4 gap-4">
      {/* Chat Section */}
      <div className="lg:col-span-3 flex flex-col">
        <Card className="flex-1 flex flex-col bg-white/70 dark:bg-gray-800/70 shadow-xl border-0">
          {/* Chat Header */}
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-50 dark:from-gray-700 dark:to-gray-700">
            <div className="flex items-center space-x-3">
              <img src="/placeholder.svg" className="w-12 h-12 rounded-full" alt="Doctor" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Dr. Nitin Mishra</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">MBBS, MD (Skin & VD)</p>
              </div>
            </div>
          </CardHeader>

          {/* Chat Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400">Please wait until the doctor joins the chat.</p>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === currentUser?.email ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${msg.sender === currentUser?.email
                  ? "bg-gradient-to-r from-blue-600 to-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border dark:border-gray-700"
                }`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">
                    {msg.timestamp?.toDate?.().toLocaleTimeString?.() ?? ""}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>

          {/* Message Input */}
          <div className="border-t p-4 bg-white/50 dark:bg-gray-700/50">
            
           {/* Quick Reply Buttons (based on role) */}
          {currentQuickReplies.length > 0 && (
             <div className="flex flex-wrap gap-2 mb-2">
              {currentQuickReplies.map((reply, idx) => (
                <Button
                  key={idx}
                  variant="secondary"
                  size="sm"
                  className="bg-slate-100 dark:bg-gray-700 dark:text-white text-gray-800 px-3"
                  onClick={() => setMessage(reply)}>
                  {reply}
                </Button>
              ))}
            </div>)}
            
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <Button type="button" variant="outline" size="sm" onClick={handleFileUpload}>
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleFileUpload}>
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleFileUpload}>
                <Video className="h-4 w-4" />
              </Button>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button type="submit" size="sm" className="bg-blue-600 text-white">Send</Button>
            </form>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,video/*,.pdf,.doc,.docx"
              multiple
            />
          </div>
        </Card>
      </div>

      {/* Sidebar with Patient Info + End Button */}
      <div className="space-y-4">
        <Card className="bg-white/70 dark:bg-gray-800/70 shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-sm dark:text-gray-100">Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><b>Name:</b> {preFormData.name}</div>
            <div><b>Age:</b> {preFormData.age}</div>
            <div><b>Gender:</b> {preFormData.gender}</div>
            <div><b>Contact:</b> {preFormData.contact}</div>
            <div><b>Urgency:</b> {preFormData.urgency}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-sm dark:text-gray-100">Chief Complaint</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-800 dark:text-gray-300">{preFormData.symptoms}</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-sm dark:text-gray-100">Quick Action</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" className="w-full">End Consultation</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

  {chatStarted && messages.length === 0 && (
  <p className="text-center text-gray-500 mt-4">
    Please wait until the doctor joins the chat.
  </p>
)}

}
