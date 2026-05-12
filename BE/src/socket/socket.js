import { socketAuth } from "./socketAuth.js";
import { Server } from 'socket.io';
import User from "../models/user.js";

// Store active calls with timeout tracking
const activeCalls = new Map();
const CALL_TIMEOUT = 60000; // 60 seconds timeout for unanswered calls

export const initializeSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
        },
    })

    const notificationNamespace = io.of('/notifications')

    notificationNamespace.use(socketAuth);
    notificationNamespace.on("connection", (socket) => {
        const {
            userId,
            roleName,
        } = socket.user

        if (roleName) {
            socket.join(`user_${userId}`)
        }

        if (roleName === "Admin") {
            socket.join(`admin`)
        }

        if (roleName === "Engineer") {
            socket.join(`engineer`)
        }

        socket.on("disconnect", () => {
            console.log("User disconnected: " + roleName + '-' + socket.id);
        })
    });

    const chatNamespace = io.of('/chat');

    chatNamespace.use(socketAuth);

    chatNamespace.on("connection", (socket) => {
        const { userId } = socket.user;
        console.log("User connected to chat namespace: " + userId + '-' + socket.id);

        //lang nghe su kien tham gia vao 1 phien chat
        socket.on("join_chat", (conversationId) => {
            socket.join(`chat_${conversationId}`);
            console.log(`User ${userId} joined chat session ${conversationId}`);
        });

        socket.on ("send_message", async (data) => {
            //data co the la: sessionId, text, role, mediatype, mediapath
            //luu tin nhan vao db qua service tai day

            //broadcast tin nhan toi client khac trong phong
            chatNamespace.to(`chat_${data.conversationId}`).emit("receive_message", data);
        });

        socket.on("leave_chat", (conversationId) => {
            socket.leave(`chat_${conversationId}`);
            console.log(`User ${userId} left chat session ${conversationId}`);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected from chat namespace: " + userId + '-' + socket.id);
        });
    });

    // WebRTC signaling namespace (1-1 video call)
    const webrtcNamespace = io.of('/webrtc');

    webrtcNamespace.use(socketAuth);
    webrtcNamespace.on("connection", (socket) => {
        const { userId } = socket.user;
        const userRoom = `user_${userId}`;

        socket.join(userRoom);
        console.log("User connected to webrtc namespace: " + userId + '-' + socket.id);

        // user joins a call room to receive broadcast signaling if needed
        socket.on("join_call", ({ callId }) => {
            if (!callId) return;
            const callRoom = `call_${callId}`;

            socket.join(callRoom);
            socket.to(callRoom).emit("user_joined_call", {
                callId,
                userId,
                socketId: socket.id,
            });
        });

        socket.on("leave_call", ({ callId }) => {
            if (!callId) return;
            const callRoom = `call_${callId}`;

            socket.leave(callRoom);
            socket.to(callRoom).emit("user_left_call", {
                callId,
                userId,
                socketId: socket.id,
            });
        });

        // A sends SDP offer -> B
        socket.on("webrtc_offer", ({ callId, targetUserId, offer }) => {
            if (!offer) return;

            const payload = {
                callId,
                fromUserId: userId,
                fromSocketId: socket.id,
                offer,
            };

            if (targetUserId) {
                webrtcNamespace.to(`user_${targetUserId}`).emit("webrtc_offer", payload);
                return;
            }

            if (callId) {
                socket.to(`call_${callId}`).emit("webrtc_offer", payload);
            }
        });

        // B sends SDP answer -> A
        socket.on("webrtc_answer", ({ callId, targetUserId, answer }) => {
            if (!answer) return;

            const payload = {
                callId,
                fromUserId: userId,
                fromSocketId: socket.id,
                answer,
            };

            if (targetUserId) {
                webrtcNamespace.to(`user_${targetUserId}`).emit("webrtc_answer", payload);
                return;
            }

            if (callId) {
                socket.to(`call_${callId}`).emit("webrtc_answer", payload);
            }
        });

        // exchange ICE candidates between peers
        socket.on("webrtc_ice_candidate", ({ callId, targetUserId, candidate }) => {
            if (!candidate) return;

            const payload = {
                callId,
                fromUserId: userId,
                fromSocketId: socket.id,
                candidate,
            };

            if (targetUserId) {
                webrtcNamespace.to(`user_${targetUserId}`).emit("webrtc_ice_candidate", payload);
                return;
            }

            if (callId) {
                socket.to(`call_${callId}`).emit("webrtc_ice_candidate", payload);
            }
        });

        // Call invitation (ringing notification)
        socket.on("call_invite", async ({ targetUserId, conversationId }) => {
            if (!targetUserId) return;

            const callId = `call_${Date.now()}_${userId}_${targetUserId}`;

            let callerProfile = {
                fullName: null,
                avatar: null,
            };

            try {
                const caller = await User.findById(userId)
                    .select("fullName avatar")
                    .lean();

                callerProfile = {
                    fullName: caller?.fullName || null,
                    avatar: caller?.avatar?.url || null,
                };
            } catch (error) {
                console.log(`Failed to load caller profile for call ${callId}: ${error.message}`);
            }
            
            // Store call info with timeout
            const callInfo = {
                callId,
                fromUserId: userId,
                toUserId: targetUserId,
                conversationId,
                status: 'ringing',
                startTime: new Date(),
                timeoutId: null,
            };

            activeCalls.set(callId, callInfo);

            // Emit to callee
            webrtcNamespace.to(`user_${targetUserId}`).emit("call_incoming", {
                callId,
                fromUserId: userId,
                fromFullName: callerProfile.fullName,
                fromAvatar: callerProfile.avatar,
                fromSocketId: socket.id,
                conversationId,
                timestamp: new Date(),
            });

            // Set timeout for unanswered call (60 seconds)
            const timeoutId = setTimeout(() => {
                if (activeCalls.has(callId)) {
                    const call = activeCalls.get(callId);
                    if (call.status === 'ringing') {
                        call.status = 'missed';
                        
                        // Notify both parties
                        webrtcNamespace.to(`user_${call.fromUserId}`).emit("call_timeout", {
                            callId,
                            reason: 'no_answer',
                        });

                        webrtcNamespace.to(`user_${call.toUserId}`).emit("call_timeout", {
                            callId,
                            reason: 'no_answer',
                        });

                        console.log(`Call ${callId} timed out - no answer`);
                        activeCalls.delete(callId);
                    }
                }
            }, CALL_TIMEOUT);

            callInfo.timeoutId = timeoutId;

            console.log(`User ${userId} invited ${targetUserId} to call (${callId})`);
        });

        // User accepts the call
        socket.on("call_accept", ({ fromUserId, conversationId, callId }) => {
            if (!fromUserId || !callId) return;

            // Clear timeout for this call
            const callInfo = activeCalls.get(callId);
            if (callInfo && callInfo.timeoutId) {
                clearTimeout(callInfo.timeoutId);
                callInfo.status = 'connected';
            }

            webrtcNamespace.to(`user_${fromUserId}`).emit("call_accepted", {
                acceptedBy: userId,
                conversationId,
                callId,
                timestamp: new Date(),
            });

            console.log(`User ${userId} accepted call from ${fromUserId} (${callId})`);
        });

        // User declines/rejects the call
        socket.on("call_decline", ({ fromUserId, conversationId, callId }) => {
            if (!fromUserId || !callId) return;

            // Clear timeout and remove from active calls
            const callInfo = activeCalls.get(callId);
            if (callInfo && callInfo.timeoutId) {
                clearTimeout(callInfo.timeoutId);
            }
            callInfo.status = 'declined';

            webrtcNamespace.to(`user_${fromUserId}`).emit("call_rejected", {
                rejectedBy: userId,
                conversationId,
                callId,
                reason: "user_declined",
                timestamp: new Date(),
            });

            console.log(`User ${userId} declined call from ${fromUserId} (${callId})`);
            activeCalls.delete(callId);
        });

        socket.on("end_call", ({ callId }) => {
            if (!callId) return;

            // Clean up call info
            const callInfo = activeCalls.get(callId);
            if (callInfo && callInfo.timeoutId) {
                clearTimeout(callInfo.timeoutId);
            }

            webrtcNamespace.to(`call_${callId}`).emit("call_ended", {
                callId,
                endedBy: userId,
                timestamp: new Date(),
            });

            console.log(`User ${userId} ended call (${callId})`);
            activeCalls.delete(callId);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected from webrtc namespace: " + userId + '-' + socket.id);

            // Clean up any active calls from this user
            for (const [callId, callInfo] of activeCalls.entries()) {
                if (callInfo.fromUserId === userId || callInfo.toUserId === userId) {
                    if (callInfo.timeoutId) {
                        clearTimeout(callInfo.timeoutId);
                    }
                    
                    // Notify other party if call was still active
                    if (callInfo.status === 'ringing' || callInfo.status === 'connected') {
                        const otherUserId = callInfo.fromUserId === userId ? callInfo.toUserId : callInfo.fromUserId;
                        webrtcNamespace.to(`user_${otherUserId}`).emit("call_ended", {
                            callId,
                            reason: 'connection_lost',
                            timestamp: new Date(),
                        });
                    }

                    activeCalls.delete(callId);
                }
            }
        });
    });

    return { io, notificationNamespace, chatNamespace, webrtcNamespace };
}