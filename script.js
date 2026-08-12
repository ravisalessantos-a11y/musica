/**
 * ==========================================================================
 * HARMONIA & SOM - MOTOR PRINCIPAL DE INTERATIVIDADE (WEB AUDIO & UI)
 * ==========================================================================
 * Este script gerencia:
 * 1. Sintetizador de Áudio Nativo (Web Audio API) para o Teclado e Amostras
 * 2. Alternância de Tema (Modo Escuro / Modo Claro com LocalStorage)
 * 3. Menu Mobile e Navegação Responsiva
 * 4. Filtro Dinâmico da Vitrine de Instrumentos
 * 5. Sistema de Teclado Físico (Atalhos de Teclado para Tocar Notas)
 * 6. Modais Interativos com Informações Detalhadas dos Instrumentos
 * 7. Formulário de Contato com Validação e Feedback (Toast)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    /* ==========================================================================
       1. MÓDULO DE ÁUDIO (WEB AUDIO API SYNTHESIZER)
       ========================================================================== */
    class AudioEngine {
        constructor() {
            this.audioCtx = null;
            this.masterGain = null;
            this.currentVolume = 0.7;
            this.activeOscillators = {};

            // Mapeamento de Frequências (Hz) para as Notas Musicais (Oitava 4)
            this.noteFrequencies = {
                'C4': 261.63,
                'C#4': 277.18,
                'D4': 293.66,
                'D#4': 311.13,
                'E4': 329.63,
                'F4': 349.23,
                'F#4': 369.99,
                'G4': 392.00,
                'G#4': 415.30,
                'A4': 440.00,
                'A#4': 466.16,
                'B4': 493.88
            };

            // Mapeamento de Teclas do Teclado Físico para Notas
            this.keyboardMap = {
                'a': 'C4',  'w': 'C#4',
                's': 'D4',  'e': 'D#4',
                'd': 'E4',  'f': 'F4',
                't': 'F#4', 'g': 'G4',
                'y': 'G#4', 'h': 'A4',
                'u': 'A#4', 'j': 'B4'
            };
        }

        // Inicializa o contexto de áudio sob demanda (exigência de navegadores modernos)
        init() {
            if (!this.audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioCtx = new AudioContext();
                this.masterGain = this.audioCtx.createGain();
                this.masterGain.gain.setValueAtTime(this.currentVolume, this.audioCtx.currentTime);
                this.masterGain.connect(this.audioCtx.destination);
            }
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
        }

        // Ajusta o Volume Geral
        setVolume(value) {
            this.currentVolume = parseFloat(value);
            if (this.masterGain && this.audioCtx) {
                this.masterGain.gain.setValueAtTime(this.currentVolume, this.audioCtx.currentTime);
            }
        }

        // Toca uma Nota Sintetizada (Piano/Teclado)
        playNote(note) {
            this.init();
            const freq = this.noteFrequencies[note];
            if (!freq) return;

            // Se a nota já estiver tocando, interrompe suavemente para evitar sobreposição
            this.stopNote(note);

            const osc = this.audioCtx.createOscillator();
            const noteGain = this.audioCtx.createGain();

            // Configuração do Oscilador (Forma de onda triangulada para som suave)
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

            // Envelope ADSR Simplificado (Ataque e Decaimento)
            const now = this.audioCtx.currentTime;
            noteGain.gain.setValueAtTime(0, now);
            noteGain.gain.linearRampToValueAtTime(0.8, now + 0.02); // Ataque rápido
            noteGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2); // Decaimento suave

            osc.connect(noteGain);
            noteGain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + 1.2);

            this.activeOscillators[note] = { osc, noteGain };
        }

        // Para uma Nota
        stopNote(note) {
            if (this.activeOscillators[note]) {
                try {
                    const { noteGain } = this.activeOscillators[note];
                    if (this.audioCtx) {
                        noteGain.gain.linearRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
                    }
                } catch (e) {
                    // Trata encerramentos antecipados
                }
                delete this.activeOscillators[note];
            }
        }

        // Sintetizador de Amostras para a Vitrine (Sons de Exemplo)
        playSample(type) {
            this.init();
            const now = this.audioCtx.currentTime;

            switch (type) {
                case 'violao':
                    // Acorde de Violão (Arpejo em Mi Menor)
                    [164.81, 246.94, 329.63, 392.00].forEach((freq, idx) => {
                        const osc = this.audioCtx.createOscillator();
                        const gain = this.audioCtx.createGain();
                        osc.type = 'sawtooth';
                        osc.frequency.setValueAtTime(freq, now + (idx * 0.08));
                        
                        gain.gain.setValueAtTime(0, now + (idx * 0.08));
                        gain.gain.linearRampToValueAtTime(0.3, now + (idx * 0.08) + 0.01);
                        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.08) + 1.5);
                        
                        osc.connect(gain);
                        gain.connect(this.masterGain);
                        osc.start(now + (idx * 0.08));
                        osc.stop(now + (idx * 0.08) + 1.5);
                    });
                    break;

                case 'piano':
                    // Acorde Clássico de Piano (Dó Maior)
                    [261.63, 329.63, 392.00, 523.25].forEach((freq) => {
                        const osc = this.audioCtx.createOscillator();
                        const gain = this.audioCtx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(freq, now);
                        
                        gain.gain.setValueAtTime(0, now);
                        gain.gain.linearRampToValueAtTime(0.4, now + 0.02);
                        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
                        
                        osc.connect(gain);
                        gain.connect(this.masterGain);
                        osc.start(now);
                        osc.stop(now + 2.0);
                    });
                    break;

                case 'bateria':
                    // Som de Bumbo + Caixa Sintetizada
                    const kickOsc = this.audioCtx.createOscillator();
                    const kickGain = this.audioCtx.createGain();
                    kickOsc.frequency.setValueAtTime(150, now);
                    kickOsc.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
                    kickGain.gain.setValueAtTime(1, now);
                    kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                    kickOsc.connect(kickGain);
                    kickGain.connect(this.masterGain);
                    kickOsc.start(now);
                    kickOsc.stop(now + 0.5);
                    break;

                case 'sax':
                    // Som Estilo Instrumento de Sopro
                    const saxOsc = this.audioCtx.createOscillator();
                    const saxGain = this.audioCtx.createGain();
                    saxOsc.type = 'square';
                    saxOsc.frequency.setValueAtTime(311.13, now); // D#4
                    saxOsc.frequency.linearRampToValueAtTime(349.23, now + 0.3); // Bend para F4
                    
                    saxGain.gain.setValueAtTime(0, now);
                    saxGain.gain.linearRampToValueAtTime(0.5, now + 0.1);
                    saxGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
                    
                    saxOsc.connect(saxGain);
                    saxGain.connect(this.masterGain);
                    saxOsc.start(now);
                    saxOsc.stop(now + 1.8);
                    break;
            }
        }
    }

    const audioApp = new AudioEngine();

    /* ==========================================================================
       2. ALTERNADOR DE TEMA (DARK / LIGHT MODE)
       ========================================================================== */
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = themeToggleBtn.querySelector('i');
    
    // Verifica preferência salva
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        themeIcon.className = 'fa-solid fa-sun';
    }

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'light') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'dark');
            themeIcon.className = 'fa-solid fa-moon';
            showToast('Modo Escuro ativado');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeIcon.className = 'fa-solid fa-sun';
            showToast('Modo Claro ativado');
        }
    });

    /* ==========================================================================
       3. NAVEGAÇÃO E MENU MOBILE (HAMBURGER)
       ========================================================================== */
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Destaque do Link Ativo no Scroll
    window.addEventListener('scroll', () => {
        let current = '';
        const sections = document.querySelectorAll('section');
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= sectionTop && pageYOffset < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    /* ==========================================================================
       4. SISTEMA DE FILTRAGEM DE INSTRUMENTOS
       ========================================================================== */
    const filterButtons = document.querySelectorAll('.filter-tag, .filter-btn');
    const instrumentCards = document.querySelectorAll('.instrument-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filterValue = button.getAttribute('data-filter');

            // Atualiza botões ativos
            document.querySelectorAll('.filter-tag').forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-filter') === filterValue) {
                    btn.classList.add('active');
                }
            });

            // Aplica filtro aos cards
            instrumentCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                
                if (filterValue === 'all' || filterValue === cardCategory) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });

            // Se o botão veio das categorias, faz rolagem suave até a vitrine
            if (button.classList.contains('filter-btn')) {
                document.getElementById('instrumentos').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    /* ==========================================================================
       5. CONTROLADORES DO ESTÚDIO VIRTUAL (TECLADO)
       ========================================================================== */
    const pianoKeys = document.querySelectorAll('.piano-keys .key');
    const volumeControl = document.getElementById('volume-control');

    // Clique nas Teclas Visuais
    pianoKeys.forEach(key => {
        const note = key.getAttribute('data-note');

        key.addEventListener('mousedown', () => {
            key.classList.add('active');
            audioApp.playNote(note);
        });

        key.addEventListener('mouseup', () => {
            key.classList.remove('active');
            audioApp.stopNote(note);
        });

        key.addEventListener('mouseleave', () => {
            key.classList.remove('active');
            audioApp.stopNote(note);
        });

        // Suporte para Telas de Toque (Mobile)
        key.addEventListener('touchstart', (e) => {
            e.preventDefault();
            key.classList.add('active');
            audioApp.playNote(note);
        });

        key.addEventListener('touchend', () => {
            key.classList.remove('active');
            audioApp.stopNote(note);
        });
    });

    // Controle de Volume
    volumeControl.addEventListener('input', (e) => {
        audioApp.setVolume(e.target.value);
    });

    // Mapeamento do Teclado Físico
    window.addEventListener('keydown', (e) => {
        if (e.repeat) return; // Evita repetição contínua ao segurar
        const key = e.key.toLowerCase();
        const note = audioApp.keyboardMap[key];

        if (note) {
            const keyElement = document.querySelector(`[data-note="${note}"]`);
            if (keyElement) {
                keyElement.classList.add('active');
                audioApp.playNote(note);
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        const note = audioApp.keyboardMap[key];

        if (note) {
            const keyElement = document.querySelector(`[data-note="${note}"]`);
            if (keyElement) {
                keyElement.classList.remove('active');
                audioApp.stopNote(note);
            }
        }
    });

    /* ==========================================================================
       6. BOTÕES DE AMOSTRA DE SOM NOS CARDS
       ========================================================================== */
    const sampleButtons = document.querySelectorAll('.play-sample');

    sampleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const soundType = btn.getAttribute('data-sound');
            
            // Efeito visual no botão ao tocar
            btn.classList.add('playing');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-wave-square"></i> Tocando...';

            audioApp.playSample(soundType);

            setTimeout(() => {
                btn.classList.remove('playing');
                btn.innerHTML = originalText;
            }, 1800);
        });
    });

    /* ==========================================================================
       7. SISTEMA DE MODAL (DETALHES DO INSTRUMENTO)
       ========================================================================== */
    const modalTriggers = document.querySelectorAll('.modal-trigger');

    // Dados dinâmicos para preenchimento dos Modais
    const instrumentDetails = {
        'modal-violao': {
            title: 'Violão Acústico',
            category: 'Cordas',
            desc: 'O violão é um instrumento de cordas de nylon ou aço, utilizado em diversos gêneros como Samba, Bossa Nova, MPB e Pop. Seu corpo oco funciona como uma caixa de ressonância natural.',
            curiosity: 'Sabia que os violões modernos derivam da vihuela e da guitarra espanhola do século XVI?'
        },
        'modal-piano': {
            title: 'Piano de Cauda',
            category: 'Teclas / Percussão',
            desc: 'O piano é um instrumento acústico em que o som é produzido por martelos de madeira revestidos de feltro que batem nas cordas esticadas quando as teclas são pressionadas.',
            curiosity: 'Possui mais de 12.000 peças individuais operando em seu mecanismo interno!'
        },
        'modal-bateria': {
            title: 'Bateria Acústica',
            category: 'Percussão',
            desc: 'A bateria é um conjunto de tambores (bumbo, caixa, tons) e pratos (ataque, condução, chimbal) organizados para serem tocados por um único músico utilizando baquetas.',
            curiosity: 'A bateria moderna se consolidou no início do século XX com a invenção do pedal de bumbo.'
        },
        'modal-sax': {
            title: 'Saxofone Alto',
            category: 'Sopro / Madeiras',
            desc: 'Apesar de ser feito de latão, o saxofone é classificado como um instrumento de madeira porque o seu som é produzido pela vibração de uma palheta de cana em seu boquilha.',
            curiosity: 'Foi inventado pelo belga Adolphe Sax em 1846, que buscava equilibrar o som das madeiras e dos metais.'
        }
    };

    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const modalKey = trigger.getAttribute('data-modal');
            const data = instrumentDetails[modalKey];

            if (data) {
                createAndShowModal(data);
            }
        });
    });

    function createAndShowModal(data) {
        // Remove modal existente se houver
        const existingModal = document.getElementById('custom-modal');
        if (existingModal) existingModal.remove();

        // Estrutura DOM do Modal
        const modalHtml = `
            <div class="modal-overlay" id="custom-modal">
                <div class="modal-content">
                    <button class="modal-close" id="modal-close">&times;</button>
                    <span class="badge">${data.category}</span>
                    <h2>${data.title}</h2>
                    <p class="modal-description">${data.desc}</p>
                    <div class="modal-curiosity">
                        <strong><i class="fa-solid fa-lightbulb"></i> Curiosidade:</strong>
                        <p>${data.curiosity}</p>
                    </div>
                    <button class="btn btn-primary btn-block" onclick="document.getElementById('custom-modal').remove()">Fechar</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Estilização dinâmica injetada temporariamente
        const modalOverlay = document.getElementById('custom-modal');
        injectModalStyles();

        setTimeout(() => modalOverlay.classList.add('visible'), 10);

        // Eventos de fechar
        document.getElementById('modal-close').addEventListener('click', () => {
            modalOverlay.classList.remove('visible');
            setTimeout(() => modalOverlay.remove(), 300);
        });

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('visible');
                setTimeout(() => modalOverlay.remove(), 300);
            }
        });
    }

    function injectModalStyles() {
        if (document.getElementById('modal-styles')) return;

        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.innerHTML = `
            .modal-overlay {
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.75);
                backdrop-filter: blur(8px);
                z-index: 2000;
                display: flex; align-items: center; justify-content: center;
                opacity: 0; transition: opacity 0.3s ease;
            }
            .modal-overlay.visible { opacity: 1; }
            .modal-content {
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-lg);
                padding: 40px;
                max-width: 500px;
                width: 90%;
                position: relative;
                color: var(--text-primary);
                transform: translateY(20px);
                transition: transform 0.3s ease;
            }
            .modal-overlay.visible .modal-content { transform: translateY(0); }
            .modal-close {
                position: absolute; top: 15px; right: 20px;
                font-size: 2rem; color: var(--text-secondary);
                cursor: pointer; background: none; border: none;
            }
            .modal-description { margin: 15px 0; color: var(--text-secondary); line-height: 1.6; }
            .modal-curiosity {
                background: var(--bg-secondary);
                padding: 15px; border-radius: var(--radius-md);
                margin-bottom: 25px; border-left: 4px solid var(--accent-color);
            }
            .modal-curiosity p { font-size: 0.88rem; color: var(--text-secondary); margin-top: 5px; }
        `;
        document.head.appendChild(style);
    }

    /* ==========================================================================
       8. FORMULÁRIO DE CONTATO COM FEEDBACK
       ========================================================================== */
    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;

            if (name && email) {
                showToast(`Obrigado, ${name}! Sua mensagem foi enviada.`);
                contactForm.reset();
            } else {
                showToast('Por favor, preencha todos os campos obrigatórios.');
            }
        });
    }

    /* ==========================================================================
       9. SISTEMA DE NOTIFICAÇÕES (TOAST SYSTEM)
       ========================================================================== */
    function showToast(message) {
        let toastContainer = document.getElementById('toast-container');
        
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 3000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.style.cssText = `
            background: var(--accent-color);
            color: #fff;
            padding: 12px 24px;
            border-radius: 30px;
            font-size: 0.9rem;
            font-weight: 600;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
        `;
        toast.innerText = message;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 10);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
});
