// AI Description Generator for Sarees
const AIDescriptionGenerator = {
  templates: {
    kanchipuram: [
      "Handwoven in the heritage looms of Kanchipuram, this exquisite {color} silk saree features intricate {motif} zari work and traditional temple borders.",
      "A masterpiece from South India's weaving tradition, this {color} Kanchipuram saree showcases {fabric} with authentic {zari} throughout.",
      "Featuring the signature {color} palette of Kanchipuram silks, this saree presents a stunning blend of {motif} patterns and classic {occasion} elegance.",
      "Hand-loomed perfection meets timeless design in this {color} saree, adorned with intricate {zari} and traditional {motif} work."
    ],
    banarasi: [
      "A quintessential {color} Banarasi masterpiece, this saree weaves together legacy and luxury with its elaborate {motif} brocade and {fabric}.",
      "Crafted in the sacred city's finest looms, this {color} Banarasi saree features premium {zari} and ornate {motif} embellishments.",
      "The epitome of {color} sophistication, this Banarasi beauty showcases dense zari work and rich {fabric} for the discerning bride.",
      "A timeless {color} heirloom-to-be, this Banarasi saree combines traditional {motif} work with contemporary {occasion} styling."
    ],
    paithani: [
      "A regal {color} Paithani with the signature peacock and lotus motifs that define Maharashtra's weaving heritage, woven in pure {fabric}.",
      "This stunning {color} Paithani presents traditional {motif} work and opulent {zari} pallu, perfect for {occasion} celebrations.",
      "Hand-woven splendor captured in {color} silk, featuring the iconic Paithani {motif} and shimmering {zari} threadwork.",
      "A collector's piece in {color}, this Paithani saree celebrates centuries of craftsmanship with intricate {motif} and authentic {fabric}."
    ]
  },

  motifs: [
    "floral vine", "peacock and lotus", "temple gopuram", "geometric border",
    "leaf motif", "nature-inspired", "traditional", "intricate", "ornamental"
  ],

  generate: function(name, category, color, fabric, zari, occasion) {
    // Clean inputs
    const cleanColor = color.toLowerCase().split('&')[0].trim();
    const templates = this.templates[category.toLowerCase()] || this.templates.kanchipuram;
    const motif = this.motifs[Math.floor(Math.random() * this.motifs.length)];

    // Select random template
    const template = templates[Math.floor(Math.random() * templates.length)];

    // Replace placeholders
    let description = template
      .replace(/{color}/g, color)
      .replace(/{fabric}/g, fabric || 'silk')
      .replace(/{zari}/g, zari || 'gold zari')
      .replace(/{motif}/g, motif)
      .replace(/{occasion}/g, occasion || 'special');

    // Add second sentence about length and blouse
    const closingSentences = [
      `Draped gracefully at 5.5 meters with an unstitched blouse piece, this saree is your canvas for creating magic on every occasion.`,
      `At 5.5 meters with complimentary blouse fabric, this saree promises an unforgettable presence and timeless elegance.`,
      `Comes with 5.5 meters of pure silk and unstitched blouse piece for a perfect fit and personalized styling.`,
      `Meticulously crafted in 5.5 meters with an unstitched blouse piece, ready to adorn the woman who appreciates true artistry.`
    ];

    const closing = closingSentences[Math.floor(Math.random() * closingSentences.length)];
    return description + " " + closing;
  }
};

// Export for use in app.js
if (typeof window !== 'undefined') {
  window.AIDescriptionGenerator = AIDescriptionGenerator;
}
