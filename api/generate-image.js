async function generateImage() {
    const prompt = document.getElementById('imagePrompt').value.trim();
    if (!prompt) {
        alert('Please enter a prompt');
        return;
    }

    const imageGrid = document.getElementById('imageGrid');
    const loading = document.getElementById('imageLoading');
    loading.style.display = 'block';

    try {
        const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to generate image');
        }
        
        if (!data.url) {
            throw new Error('No image URL received');
        }

        const imgWrapper = document.createElement('div');
        const img = document.createElement('img');
        img.src = data.url;
        img.alt = prompt;
        img.className = 'generated-image';
        imgWrapper.appendChild(img);
        imageGrid.insertBefore(imgWrapper, imageGrid.firstChild);
    } catch (error) {
        console.error('Error:', error);
        alert(`Failed to generate image: ${error.message}`);
    } finally {
        loading.style.display = 'none';
    }
}