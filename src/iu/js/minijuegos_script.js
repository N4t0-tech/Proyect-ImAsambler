document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const slides = document.querySelectorAll('.slide');
    const indicators = document.querySelectorAll('.indicator');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const gameCards = document.querySelectorAll('.game-card');
    
    // Variables de estado
    let currentSlide = 0;
    const totalSlides = slides.length;
    
    // Función para actualizar la visualización de slides
    function updateSlide() {
        // Ocultar todos los slides
        slides.forEach(slide => {
            slide.classList.remove('active');
        });
        
        // Mostrar slide actual
        slides[currentSlide].classList.add('active');
        
        // Actualizar indicadores
        indicators.forEach((indicator, index) => {
            if (index === currentSlide) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
        
        // Actualizar estado de botones
        prevBtn.disabled = currentSlide === 0;
        nextBtn.disabled = currentSlide === totalSlides - 1;
        
        // Actualizar texto de los botones si es necesario
        prevBtn.innerHTML = currentSlide === 0 ? 
            '<i class="fas fa-arrow-left"></i> Anterior' : 
            `<i class="fas fa-arrow-left"></i> Nivel ${currentSlide}`;
            
        nextBtn.innerHTML = currentSlide === totalSlides - 1 ? 
            'Siguiente <i class="fas fa-arrow-right"></i>' : 
            `Nivel ${currentSlide + 2} <i class="fas fa-arrow-right"></i>`;
    }
    
    // Función para ir al slide siguiente
    function nextSlide() {
        if (currentSlide < totalSlides - 1) {
            currentSlide++;
            updateSlide();
        }
    }
    
    // Función para ir al slide anterior
    function prevSlide() {
        if (currentSlide > 0) {
            currentSlide--;
            updateSlide();
        }
    }
    
    // Función para ir a un slide específico
    function goToSlide(slideIndex) {
        if (slideIndex >= 0 && slideIndex < totalSlides) {
            currentSlide = slideIndex;
            updateSlide();
        }
    }
    
    // Eventos para botones de navegación
    nextBtn.addEventListener('click', nextSlide);
    
    prevBtn.addEventListener('click', prevSlide);
    
    // Eventos para indicadores
    indicators.forEach(indicator => {
        indicator.addEventListener('click', function() {
            const slideIndex = parseInt(this.getAttribute('data-slide'));
            goToSlide(slideIndex);
        });
    });
    
    // Navegación con teclado
    document.addEventListener('keydown', function(event) {
        if (event.key === 'ArrowRight') {
            nextSlide();
        } else if (event.key === 'ArrowLeft') {
            prevSlide();
        }
    });
    
    // Efectos interactivos para las tarjetas de juego
    gameCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('i');
            icon.style.transform = 'scale(1.2) rotate(5deg)';
            icon.style.transition = 'transform 0.3s ease';
            this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.3)';
        });
        
        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('i');
            icon.style.transform = 'scale(1) rotate(0deg)';
            this.style.boxShadow = 'none';
        });
        
        // Click en tarjeta para ir al slide correspondiente
        card.addEventListener('click', function() {
            const cardIndex = Array.from(gameCards).indexOf(this);
            goToSlide(cardIndex);
        });
    });
    
    // Inicializar la visualización
    updateSlide();
    

});