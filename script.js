// --- Configuração do Firebase ---
const firebaseConfig = {
    apiKey: "AIzaSyDIeImR1lRYdEBCVhcB2gdm2NIogUEh1FU",
    authDomain: "joselia-24972.firebaseapp.com",
    databaseURL: "https://joselia-24972-default-rtdb.firebaseio.com",
    projectId: "joselia-24972",
    storageBucket: "joselia-24972.firebasestorage.app",
    messagingSenderId: "62542621074",
    appId: "1:62542621074:web:16d0b1aaef8a41c2a7794b",
    measurementId: "G-C2J3CJ3LSJ"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const firestore = firebase.firestore();

document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. Animações Fade-In usando Intersection Observer ---
    const faders = document.querySelectorAll('.fade-in');
    const appearOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const appearOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, appearOptions);

    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });

    // --- 2. Contador Regressivo (2 de Maio de 2026 às 10h) ---
    const weddingDate = new Date("May 2, 2026 10:00:00").getTime();

    const updateCountdown = () => {
        const now = new Date().getTime();
        const distance = weddingDate - now;

        if (distance < 0) {
            document.getElementById("countdown").innerHTML = "<span>Chegou o grande dia!</span>";
            return;
        }

        const d = Math.floor(distance / (1000 * 60 * 60 * 24));
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById("days").innerText = d.toString().padStart(2, '0');
        document.getElementById("hours").innerText = h.toString().padStart(2, '0');
        document.getElementById("minutes").innerText = m.toString().padStart(2, '0');
        document.getElementById("seconds").innerText = s.toString().padStart(2, '0');
    };

    setInterval(updateCountdown, 1000);
    updateCountdown();

    // --- 3. Interação do Formulário RSVP ---
    const rsvpForm = document.getElementById('rsvpForm');
    if (rsvpForm) {
        // Gerenciar quantidade de pessoas e nomes dos acompanhantes
        const quantidadeSelect = document.getElementById('quantidade-select');
        const nomesContainer = document.getElementById('nomes-container');
        const nomesFields = document.getElementById('nomes-fields');
        
        const atualizarNomesFields = () => {
            const quantidade = parseInt(quantidadeSelect.value) || 1;
            
            if (quantidade > 1) {
                nomesContainer.style.display = 'block';
                nomesFields.innerHTML = '';
                
                // Criar campos para os acompanhantes (começando de 2, pois o 1º é o dono do convite)
                for (let i = 2; i <= quantidade; i++) {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.className = 'nome-input';
                    input.name = `nome-acompanhante-${i}`;
                    input.placeholder = `Nome da pessoa ${i}`;
                    input.required = true;
                    nomesFields.appendChild(input);
                }
            } else {
                nomesContainer.style.display = 'none';
            }
        };
        
        // Listener para mudanças na quantidade
        quantidadeSelect.addEventListener('change', atualizarNomesFields);
        
        const submitBtn = rsvpForm.querySelector('button[type="submit"]');
        rsvpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            submitBtn.disabled = true;

            const nome = rsvpForm.querySelector('input[name="nome"]').value.trim();
            const telefone = rsvpForm.querySelector('input[name="telefone"]').value.trim();
            const quantidade = parseInt(quantidadeSelect.value) || 1;
            const presenca = rsvpForm.querySelector('select[name="presenca"]').value;
            const mensagem = rsvpForm.querySelector('textarea[name="mensagem"]').value.trim();
            
            // Coletar nomes dos acompanhantes
            const acompanhantes = [];
            for (let i = 2; i <= quantidade; i++) {
                const nomeAcompanhante = rsvpForm.querySelector(`input[name="nome-acompanhante-${i}"]`)?.value.trim();
                if (nomeAcompanhante) {
                    acompanhantes.push(nomeAcompanhante);
                }
            }

            try {
                // Validar se o nome existe na lista de convidados
                const convidadosSnapshot = await firestore.collection('convidados')
                    .where('nome', '==', nome)
                    .get();

                if (convidadosSnapshot.empty) {
                    alert('Desculpe, este nome não está na lista de convidados. Se acredita que é um erro, entre em contato conosco.');
                    submitBtn.disabled = false;
                    return;
                }

                // Verificar se já foi confirmado
                const jaConfirmado = await firestore.collection('confirmacoes')
                    .where('nome', '==', nome)
                    .get();

                if (!jaConfirmado.empty) {
                    alert('Desculpe, este nome já foi confirmado. Obrigado!');
                    submitBtn.disabled = false;
                    return;
                }

                // Salvar confirmação
                await firestore.collection('confirmacoes').add({
                    nome,
                    telefone,
                    quantidade,
                    acompanhantes,
                    mensagem,
                    presenca,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                alert('Obrigado! Sua presença foi confirmada com sucesso.');
                rsvpForm.reset();
                atualizarNomesFields(); // Resetar campos de acompanhantes
            } catch (error) {
                console.error('Erro ao salvar confirmação:', error);
                alert('Ocorreu um erro ao enviar. Por favor, tente novamente.');
            }

            submitBtn.disabled = false;
        });
    }
});

