# Product Requirements Document (PRD)
## SAWI - WhatsApp Chatbot

### Document Information
- **Document Version:** 1.0
- **Date started:** 11 Juni 2025
- **Author / Executor:** AI JNP
- **Community / Target Users:** JANAKA
- **Stakeholders:** JANAKA Jounin, AI JNP

---

## Table of Contents
1. [Product Overview](#1-product-overview)
2. [User Requirements](#2-user-requirements)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [Technical Specifications](#5-technical-specifications)

---

## 1. Product Overview

### 1.1 Product Name
Sawi - Chatbot

### 1.2 Product Vision
Mengembangkan chatbot WhatsApp yang dapat merespons perintah otomatis dan mengelola aktivitas grup secara efisien melalui WebSocket API.

### 1.3 Product Mission
Menyediakan solusi otomatisasi komunikasi WhatsApp yang mudah digunakan untuk meningkatkan produktivitas dan interaksi grup.

---

## 2. User Requirements

### 2.1 Target Users
- **Primary:** Administrator grup WhatsApp
- **Secondary:** Anggota grup yang membutuhkan informasi cepat
- **Tertiary:** Business owners yang ingin mengotomatisasi customer service

### 2.2 User Stories

#### 2.2.1 Administrator
- Sebagai admin, saya ingin bot merespons command secara otomatis
- Sebagai admin, saya ingin mendapat notifikasi ketika ada anggota baru bergabung
- Sebagai admin, saya ingin dapat mention semua anggota grup sekaligus

#### 2.2.2 End User
- Sebagai user, saya ingin mendapat informasi waktu dengan command `/time`
- Sebagai user, saya ingin melakukan health check dengan command `/ping`
- Sebagai user, saya ingin mendapat sapaan otomatis dengan command `/morning`

---

## 3. Functional Requirements

### 3.1 Core Features

#### 3.1.1 Event Handling
- **Message Events:** Memproses pesan masuk dari grup tertentu
- **Group Participant Events:** Mendeteksi aktivitas dari grup tertentu
- **Session Status:** Monitoring status koneksi WebSocket

#### 3.1.2 Command Feature
**Feature:** Bot dapat memproses command yang dimulai dengan "/"

**Commands:**
- `/ping` - Health check response
- `/morning` - Morning greeting
- `/time` - Current time information
- `/author` - Bot creator information
- `/everyone` - Mention all group members

### 3.2 Technical Architecture

#### 3.2.1 Tech stack
- Programming Language: Typescript
- Framework: Deno / Hono
- Object Storage: R2 Cloudflare
- Database: Upstash Redis
- Deployment: Deno deploy / Cloudflare workers
- Whatsapp service: WAHA / Whapi
- Thrirdparty API : sumopod
---

## 4. Non-Functional Requirements

### 4.1 Performance
- **Response Time:** Command response dalam 2 detik
- **Throughput:** Handle 100 concurrent commands
- **Memory Usage:** < 100MB RAM usage

### 4.2 Reliability
- **Uptime:** 99.5% availability
- **Error Handling:** Graceful degradation pada API errors
- **Auto Recovery:** Automatic reconnection pada connection loss

### 4.3 Security
- **API Key Protection:** Secure storage untuk credentials
- **Access Control:** Restricted access ke grup tertentu
- **Input Validation:** Sanitasi untuk semua user inputs

### 4.4 Scalability
- **Horizontal Scaling:** Support multiple bot instances
- **Command Extensibility:** Easy addition untuk commands baru
- **Multi-Group Support:** Capability untuk handle multiple groups

---

## 5. Technical Specifications

### 5.1 Technology Stack
- **Runtime:** Deno/Node.js dengan TypeScript
- **Communication:** WebSocket untuk real-time messaging
- **API Integration:** WhatsApp Web API
- **Architecture:** Event-driven architecture

### 5.2 Integration Requirements
- WhatsApp Web API compatibility
- WebSocket connection stability
- JSON message parsing
- Environment variable management

### 5.3 Data Flow
1. WebSocket receives message event
2. Parse JSON payload
3. Validate sender dan chat ID
4. Extract command dari message body
5. Execute corresponding command handler
6. Send response melalui API
