/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ShoppingBag, 
  Search, 
  User, 
  Menu, 
  X, 
  Plus, 
  ArrowRight, 
  ArrowLeft,
  ChevronLeft, 
  ChevronRight, 
  Truck, 
  Smile, 
  CheckCircle, 
  AlertCircle,
  Smartphone,
  Mail,
  Instagram,
  Facebook,
  MapPin,
  Phone,
  MessageCircle,
  Music,
  Star,
  Share2,
  Bus,
  Clock,
  CreditCard,
  ChevronDown,
  Calendar,
  Filter,
  Info,
  TrendingUp,
  Package,
  Lock,
  Pencil,
  Trash2,
  Image as ImageIcon,
  MoreVertical,
  Edit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  useParams, 
  useNavigate, 
  useLocation,
  useSearchParams,
  Link
} from 'react-router-dom';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { 
  db, 
  auth, 
  logout, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  setDoc, 
  getDoc, 
  increment, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp,
  updateDoc,
  deleteDoc,
  where
} from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInAnonymously,
  User as FirebaseUser 
} from 'firebase/auth';

// --- Types ---

interface CountryConfig {
  name: string;
  currency: string;
  flag: string;
  phonePrefix: string;
  capital: string;
  otherRegionsLabel: string;
  deliveryFees: {
    capital: number;
    other: number;
  };
  exchangeRate: number;
  names: string[];
  locations: string[];
}

const COUNTRY_CONFIG: Record<string, CountryConfig> = {
  SN: {
    name: "Sénégal",
    currency: "CFA",
    flag: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiywB6VOwmm62wDzZD1Vex31SnJvXkB0pk7ASTq0OOnNBJeFsPw0M87N3wM2GHfohSFUrdEgIylkXCeAx0LoJKWE4zcgJbq43FzsJPoyBrncjOv9tIs7XLSfkyJN0pUgs4s0yavNNUwj7nhobhzEUteGB_VxyPb5s1AN8UB3kBWknPVzHqDBdbRR_QUKc4/s400/26615154-senegal-rond-pays-drapeau-senegalais-cercle-nationale-drapeau-republique-de-senegal-circulaire-forme-bouton-banniere-eps-vecteur-illustration-vectoriel-removebg-preview.jpg",
    phonePrefix: "+221",
    capital: "Dakar",
    otherRegionsLabel: "Hors de Dakar",
    deliveryFees: {
      capital: 0,
      other: 2000
    },
    exchangeRate: 1,
    names: ["Mariama D.", "Abdoulaye S.", "Fatou K.", "Ousmane T.", "Awa N.", "Moussa B.", "Khady G.", "Ibrahima F.", "Aminata C.", "Samba L.", "Bineta S.", "Cheikh D.", "Astou M.", "Babacar N.", "Coumba S.", "Djibril K.", "Seynabou G.", "Modou L.", "Mame B.", "Youssou N."],
    locations: ["Dakar", "Diourbel", "Fatick", "Kaffrine", "Kaolack", "Kédougou", "Kolda", "Louga", "Matam", "Saint-Louis", "Sédhiou", "Tambacounda", "Thiès", "Ziguinchor"]
  }
};

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  images: string[];
  badge?: string;
  category: string;
  description: string;
  rating: number;
  reviewsCount: number;
  slug: string;
  bundleOptions?: {
    quantity: number;
    price: number;
    discountBadge?: string;
    isPopular?: boolean;
  }[];
  reviews?: Review[];
}

interface CartItem extends Product {
  quantity: number;
}

interface Review {
  id: number;
  name: string;
  location: string;
  rating: number;
  comment: string;
  date: string;
  image?: string;
  images?: string[];
  productName?: string;
  productId?: number;
}



// --- Data ---

const generateProductReviews = (productName: string, countryCode: string = 'SN'): Review[] => {
  const config = COUNTRY_CONFIG[countryCode] || COUNTRY_CONFIG.SN;
  const names = config.names;
  const locations = config.locations;
  const comments = [
    "Produit incroyable ! Je recommande vivement.",
    "Livraison très rapide. Très satisfait.",
    "Bonne qualité, conforme à la description.",
    "Excellent service client. Merci !",
    "Je l'utilise tous les jours, c'est parfait.",
    "Très bon rapport qualité-prix.",
    "Magnifique ! Exactement ce que je cherchais.",
    "Superbe expérience d'achat.",
    "Un peu de retard mais le produit est top.",
    "Je recommande à 100%.",
    "Vraiment efficace, je vois déjà les résultats.",
    "Le meilleur achat que j'ai fait cette année.",
    "Service impeccable et produit de qualité.",
    "Très pratique et facile à utiliser.",
    "Je suis ravie de ma commande, merci Vintech.",
    "Top ! Livraison gratuite respectée.",
    "Conforme aux photos, je valide.",
    "Superbe découverte, je vais en racheter.",
    "Efficacité prouvée, je suis bluffé.",
    "Rien à dire, c'est du 5 étoiles."
  ];
  const images = [
    "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh1on2c_hYVTLX1SQIxNebB0TR1LbpwiRRlCT5WWkREPZVeRmwDD4uP-5z5GfGA5PfF_-dQMrxPAJFYH3xwVh1GepjDV-kKsWxJAVTSoAL7t4AYzIXoWh0WBymo2fqfZs1xqdRwlQBN02raqGODyTcHt3H0YCSxi9nc2tABU1Lwn0UtiQbhRT9ci2cwJa8/s400/gg.jpg",
    "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjeOpOEYc917IE6fOF2HWYVCbRSxBCo4A8ACprSLuFiedsdeJpz21EW0cG4f5Lpgn84Othl12OCNK0fGywKqniWJngOu6-1p91Z_n_a2vq-J8-oDiQnHJyYVQpH3bEA6Sjek-PDKCJdPeioq-FJ2avjvc8dCa0QagbtlNGy-zTvdP_cKcEh0YfhYG14VLw/s400/1_a20b5a00-fe4a-49d9-8f28-5ed2f955cda3.jpg",
    "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh8Si_KfDZpSM9WI0y4wdJQ-ulVKXXEpXGntRoQqqdkhvlh4p4SUIoF9xQA8HGqAeb3QQZ2hbPmJvgj7j4YF4AXHkOsWqfKDPb4RJmubv-girlbWjhnMqJbM8K1a3MrkJS8GfjMUKgMHYW3G3_UiyYkFTUg8EtiALoR-5hZw7K6nDnmsVqSjxcsWLgSH_I/s400/4_a1a21a18-25bf-43b0-bbc0-a84842e2479d.jpg",
    "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjV2fQNQmgifkmoPdYdqw9P8gxD4qbAYAc8u8HLONEcSjajolTEcwlkFnJNzPIA9BQNCx9be1g5yK2eGzWYIU41Xcf6S8-Sk_rr9o7IV2jUY35ajmWNKQAy0u3r3vqAnUVrUyXyPDfgLzxlF68fSAuTkqeUxIyeXb6ULlsqD-GUFBQN-GOREbgtV0mW5AA/s400/6_9f802d38-9fc0-452a-94ac-5927bd8cc23a.jpg",
    "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhFLiPz5FCkPgOU7o2L-NHDIHPQFZRCB0U0KgedtrKjGOzUo7bBQiqCQcpUqAUDgF-x0d0e_3ewED6cYghrIEPlViv-4E6kr5-tIOlTxqoXUcTMguhp_G0PWEhsnPKSfFEhdHey5hKCKj9P1edeRwWxMzYNZy8AYpn8qXDr0nSS9dJj_W9Mx0Jps6L-vYo/s400/5_703af2b6-9f57-44b0-99b2-454a91154111.jpg",
    "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiyY51yjuzW0RRAU5oIBEHgcxdoyvSu8M4DeggPJM9m3SSp8jkTkZN6LrFjAlwOcCUhcnfILujXTQ9bbF16_M6p2xNAryxT1cAvIcUz9CkPM7sir7NNz2Pg01bJHhMYEo90uX-uvs5wAxpCD8Y4dUtxxJYb895iPxaxZsXeAaEAqpQUKBAbOqXU2I99UOQ/s400/2_62c59104-652a-43c3-b110-bb8c99de11c2.jpg",
    "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj2zhAXpduJtqLDCYPtXm_-CmNF1dc_EyGnPwqRdGWbLowr_0F1aWYwWqL4k8nKuUP7yI36S0XJW_ITCbC33Jzo_-9xh-FUw0wQdnNfav2waIfpfCQd8Kbwib3kx_J5t1tPndQUVC9ikN15D_HvRyaQJWWGqrHigDNyLkrZfNTqHFengRZZ8rrUE5vCNXc/s400/S29f4f052e42d46c3aa3a7cb1a026ccc2z.jpg",
    "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgSmuTmWQYvVbXGftyseNA8k57ieBWKAdugog03euANdSvey3EofdUFgyHfjLn_ryFelrAkHn4wtmNAyLc-5tw9hEfJdFmlX01Vr0jGb1peohRjhM3aOk1n8cGQgXf6viT9GmLiJzP-_LfQ1uPT8KP90oQ4gOz3rMJEQXrHcFGJn7wRr8vYj3BhOjUewPk/s400/S0a72ec4ffe5a4af2a042647c23dc6807Q.jpg",
    "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgDLDU8Vrb6LbGoFzjkaIsc2Y8ZkcwM09dn3Nj8uY3xkURwlBHq4nFCD0jolqOaIHU8UVFRTyZHmeAJ6GzM7hbvSC3XhLKzG7BFHFOVSGWsi7RubJ_3-GuCcJTtUM-yPU4-STET7_JQ5oXLvpTHEMkJz8SjwI6NreBIzkUoPX_g6Atu2ucEBl6fk7dNUgY/s400/Afe6d40791d69480bb920204f5250f1c8L.jpg",
    "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjb7wOOGr39lpCG3mLfTLu5ysAUc2AEdyHMrpIlV_JFjuAnrq5LYvWcTzOmCgZOZdrqWBtQ_1co7VIFZ19QG3I1BN0Bp5Tx_Sa7E2EYHP4vTorkT83JBoEXLjwOm-pyI3F5GY0zRYlA-pT3fVGgRpEems1sfnoXbpWMLumeFCiDZ9618nIK-vPkn3PxY98/s400/A27ef844a2ad94400955cae1587fdf85eb.jpg",
    "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi-GpZgFrNwaaKZ41bIrloPbfbVbYrC_RGEjqtDfMXt-xo3LGbnyPzL1qyrMIref6-U7iYgl_nvw1FJ2ZHeXOcHZU_faBSkWA7bdbabXvb8uuFR7pr6vknjPt1gLF2pUHxIkx61-lS8tHhohLh5IH2VLq3WUtyRv8eLTWu6kPSdudQlsIStJj7F_Wv89Ew/s400/A140ed71c73a14fb2943d313b31d8fde4Y.jpg",
    "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEip548QtNyElLrL48nS8yGVfop_Olosdrh07J8FMmwZHvxOWBf8_yYP8-e63wWt5X6QBDRGHFXcv60dUWdHoUSE1rTYNWy5hfwFTcyUbyHH_hlDDAdsX9a1oO_HpORZtSaT7DbTAeu5hH5V_IusZogfiDvxHu1Hor-j08ijHZAaqaIEXaOFIrDjDKNN-MA/s400/A917e1ef8cc534a5d9af10bad91989a8b6.jpg",
    "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiRz0dS9q0_OxHqtBsz0kyet3hCUs9-So9lGcH2UxFop6tS4hrNksF6vnWmYKrZrT58UlS7fzXg0SxSKF0UHLwoNV8zc16ytZ6CeU_Tox-8FsP5hpwDsW5QGGztQdXXXJZAFRXRO-sXa_0dYIYgQhgayzXFduf9qXNqTLy5IKYwSTKPsl5rlDBxFSxs-zo/s400/Ad625b2c2724b412982f0d1d56bef8f60k.jpg",
    "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgTxwqaCv_M0Mu3IkP6RFcTBm4SFOy_wrBf1u8eetJIJIf3IcbN_CrvGNcfC-aZlWm1KQfPiNEj_8StTjdnwrqYYZhud_L9oSkNdH0Ogd5zcrpGtpcH6oPC2ddV7MDjzj0ogTrUjOueRgQPjfC-cn_O9IPfjNJpKLnFupRHQ1SVBiSYRy9sP_XU1GraGRw/s400/Ab661883b287e4849b133a5df943f057cT.jpg",
    "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEglj7GrQzsVS-aXH46h_z-VB4WYSml1FjUFbI3I5webZ72sLgiEhkyP0oTcP8H-o4aKjkU_o8M4meAQcZ3X6SQ-1VoDcA3CGlP9MnZ-TWIqR3BX3QZ2dhF_5VHthe-29uOvujE6HY-nRRHO14ISI40yCJ5D42wIfQYk0sP_th-UKcxIN3BulqV7YgvVGik/s400/Ac75b2a408f794805b111618ab99d18bbA.jpg",
    "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjyePmt9DhSxhvDuxYaZjcgvspI2IOD03vDB01w6L7ciqZznlcZEXrjaEdg-FluwhcjNDKTlBjyT8muP8KhIGw_jk5s1au7gwEb3aH1EF7R14rlVyXf5_boqVdDe1XZLNXzlraTeeP7meoJmrkekoZbfEkjxNHZyiRJfkWmOvb8CmT92T9gEa2YvO3YG4o/s400/A7a9d9ad0892b4c39a9785680bb56f8d4t.jpg",
    "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgoo0fJSSInvZxiMIoBztVBSy7OU6eBNmOd2F9L5pSmBAXJEghMlwWBc0jm-5qdu2ylqROZbNePCq5Hy8Lli1Y8GeCqb69pSGxSpduWylUKSy3kMJ67bTALxKQhbHcUgXb_1vulSr5ziqi-z2r9f72V8IJZytnfV3y6ZTs-M5NAaSC6zMN_crGlCWeKHyY/s400/Ae83633b6e67c4a0aa2016c236a105986m.jpg",
    "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhbSNYko663Yg3KstamvXlLHDKRPSRyR4O-v-9zT9EN9eAsBxiD9YaFhQJOcYK1166XMAD1DuU9IF646oNR_a6c6iCdV5sraRW65g2ieyVBVq_8KFMJ2-SfDowi8SVb-qOKBaX_V3f0oG6auj0IXxsQGNrUNy3QU2u2wkJXwtbnsLFFr2YikMhl9ifxArg/s400/A61e2975c4c8f46ca90bb3d71951affedL.jpg",
    "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj32JRBX3ioqZkarQP4pBCB1oNPdT5ySUxEkt_9OeHYGE7zMaHqD33Vw9mwYk5yJNRvAqWqwPEoRMnDAOodASzCCEsttw7QihWNcYJiKrCmV2mci1JLm0lQNxlrt4uhrCBDWWw7hJ_xSQ7WUo1TabMtm8I7vuv1TVEGzp6sQvm3ADmijbK9yrI7uED7rMo/s400/Afb846a3dfc1e44df9e842d4b63103fe4C.jpg",
    "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiW5sIYQ5uiqq9Dmi5SsB6Tq5pIYOiRcaJZBsPHHNZtGZYFV1YmAzYGNQGws1BS3T8WtUGbNccypBH8RckTj34HEYU5SNfk1gT35Gjho78qdJdaNZeCyEYQ4-3e0pgvy8sga_x2ahSXjxv2hstRhup0odudfWEeL55UMSSbBvBzI6mBKyTIPPYAuwH2pIM/s400/A673e1d8587d64654887257f27726ae9b6.jpg"
  ];

  return Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    name: names[i % names.length],
    location: locations[i % locations.length],
    rating: 5,
    comment: comments[i % comments.length],
    date: (() => {
      const dateTypes = ["date", "relative", "recent"];
      const dateType = dateTypes[Math.floor(Math.random() * dateTypes.length)];
      if (dateType === "recent") {
        const hours = [1, 2, 4, 6, 10, 12, 17, 20];
        return `Il y a ${hours[Math.floor(Math.random() * hours.length)]} heures`;
      }
      if (dateType === "date") {
        const years = [2025, 2026];
        const year = years[Math.floor(Math.random() * years.length)];
        const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
        const monthIndex = year === 2026 ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 12);
        const month = months[monthIndex];
        const day = Math.floor(Math.random() * 28) + 1;
        return `Le ${day} ${month} ${year}`;
      }
      const relatives = ["Il y a 2 semaines", "Il y a 1 mois", "Il y a 3 mois", "Il y a 6 mois", "Il y a 1 an"];
      return relatives[Math.floor(Math.random() * relatives.length)];
    })(),
    image: images[i % images.length],
    productName: productName,
    productId: undefined // We'll handle this in the loop if needed, or just use productName
  }));
};

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Kit de Nettoyeur d’Oreille ✨",
    price: 11900,
    originalPrice: 19990,
    image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh1on2c_hYVTLX1SQIxNebB0TR1LbpwiRRlCT5WWkREPZVeRmwDD4uP-5z5GfGA5PfF_-dQMrxPAJFYH3xwVh1GepjDV-kKsWxJAVTSoAL7t4AYzIXoWh0WBymo2fqfZs1xqdRwlQBN02raqGODyTcHt3H0YCSxi9nc2tABU1Lwn0UtiQbhRT9ci2cwJa8/s400/gg.jpg",
    images: [
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh1on2c_hYVTLX1SQIxNebB0TR1LbpwiRRlCT5WWkREPZVeRmwDD4uP-5z5GfGA5PfF_-dQMrxPAJFYH3xwVh1GepjDV-kKsWxJAVTSoAL7t4AYzIXoWh0WBymo2fqfZs1xqdRwlQBN02raqGODyTcHt3H0YCSxi9nc2tABU1Lwn0UtiQbhRT9ci2cwJa8/s400/gg.jpg",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjeOpOEYc917IE6fOF2HWYVCbRSxBCo4A8ACprSLuFiedsdeJpz21EW0cG4f5Lpgn84Othl12OCNK0fGywKqniWJngOu6-1p91Z_n_a2vq-J8-oDiQnHJyYVQpH3bEA6Sjek-PDKCJdPeioq-FJ2avjvc8dCa0QagbtlNGy-zTvdP_cKcEh0YfhYG14VLw/s400/1_a20b5a00-fe4a-49d9-8f28-5ed2f955cda3.jpg",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh8Si_KfDZpSM9WI0y4wdJQ-ulVKXXEpXGntRoQqqdkhvlh4p4SUIoF9xQA8HGqAeb3QQZ2hbPmJvgj7j4YF4AXHkOsWqfKDPb4RJmubv-girlbWjhnMqJbM8K1a3MrkJS8GfjMUKgMHYW3G3_UiyYkFTUg8EtiALoR-5hZw7K6nDnmsVqSjxcsWLgSH_I/s400/4_a1a21a18-25bf-43b0-bbc0-a84842e2479d.jpg",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjV2fQNQmgifkmoPdYdqw9P8gxD4qbAYAc8u8HLONEcSjajolTEcwlkFnJNzPIA9BQNCx9be1g5yK2eGzWYIU41Xcf6S8-Sk_rr9o7IV2jUY35ajmWNKQAy0u3r3vqAnUVrUyXyPDfgLzxlF68fSAuTkqeUxIyeXb6ULlsqD-GUFBQN-GOREbgtV0mW5AA/s400/6_9f802d38-9fc0-452a-94ac-5927bd8cc23a.jpg",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhFLiPz5FCkPgOU7o2L-NHDIHPQFZRCB0U0KgedtrKjGOzUo7bBQiqCQcpUqAUDgF-x0d0e_3ewED6cYghrIEPlViv-4E6kr5-tIOlTxqoXUcTMguhp_G0PWEhsnPKSfFEhdHey5hKCKj9P1edeRwWxMzYNZy8AYpn8qXDr0nSS9dJj_W9Mx0Jps6L-vYo/s400/5_703af2b6-9f57-44b0-99b2-454a91154111.jpg",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiyY51yjuzW0RRAU5oIBEHgcxdoyvSu8M4DeggPJM9m3SSp8jkTkZN6LrFjAlwOcCUhcnfILujXTQ9bbF16_M6p2xNAryxT1cAvIcUz9CkPM7sir7NNz2Pg01bJHhMYEo90uX-uvs5wAxpCD8Y4dUtxxJYb895iPxaxZsXeAaEAqpQUKBAbOqXU2I99UOQ/s400/2_62c59104-652a-43c3-b110-bb8c99de11c2.jpg"
    ],
    badge: "-40%",
    category: "Hygiène",
    description: "👂✨ Dites adieu aux cotons-tiges !\nNotre Kit de Nettoyeur d’Oreille nettoie en douceur, en toute sécurité, pour des oreilles propres et une audition optimale.\n\nPourquoi le choisir ?\n\n🔎 Extraction douce et efficace : silicone ou acier inoxydable, sans agresser l’oreille\n\n🧼 Hygiène parfaite : élimine cérumen et impuretés\n\n♻️ Réutilisable & écologique : fini les cotons-tiges jetables\n\n🧰 Kit complet multi-embouts : nettoyage, massage et élimination ciblée\n\nBienfaits :\n\n👂 Protège vos oreilles sans risque\n\n🦻 Améliore l’audition en supprimant les bouchons\n\n🌍 Alternative économique et éco-responsable\n\n👨👩👧 Convient à toute la famille (enfants sous surveillance)\n\n💆♂️ Sensation de propreté et de confort immédiate\n\nMode d’emploi :\n\n🔄 Choisissez l’embout adapté\n\n↪️ Insérez doucement dans le conduit\n\n🔄 Nettoyez avec un mouvement circulaire\n\n💧 Lavez l’embout après usage\n\n🌟 Offrez à vos oreilles un soin professionnel, tous les jours !",
    rating: 4.8,
    reviewsCount: 34,
    slug: "nettoyeur-oreilles-smartbud",
    bundleOptions: [
      { quantity: 1, price: 11900 },
      { 
        quantity: 2, 
        price: 22000, 
        discountBadge: 'Économise 15% 🎁',
        isPopular: true 
      },
      { 
        quantity: 3, 
        price: 31000, 
        discountBadge: 'Économise 25% 🎁' 
      }
    ],
    reviews: [
      { id: 101, name: "Mariama D.", location: "Dakar", rating: 5, comment: "Incroyable ! On voit tout sur le téléphone, c'est super impressionnant et très efficace. Je ne peux plus m'en passer.", date: "15 Janvier 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Adfa80fcdb5a449da8fac47b4865ed897y.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A7fa799341c33470691ff6896a778637e7.jpg_960x960q75.jpg_.avif"] },
      { id: 102, name: "Fatou K.", location: "Thiès", rating: 5, comment: "Je n'en attendais pas grand-chose et j'ai été bluffée ! Mon seul regret ? Ne pas l'avoir découvert plus tôt ! 😄", date: "22 Janvier 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Abbf64d746519490da166fae881cb16c2G.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A2595d43860384bc6affdfad2c7d3b1e3r.jpg_960x960q75.jpg_.avif"] },
      { id: 103, name: "Abdoulaye S.", location: "Saint-Louis", rating: 5, comment: "Bon produit... je le recommande et la caméra a une bonne résolution.", date: "02 Février 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A4d950cb9143b453c9954dd51df52a865C.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A5199c405c3ae45a7978e5674d2c90b383.jpg_960x960q75.jpg_.avif"] },
      { id: 104, name: "Ousmane T.", location: "Ziguinchor", rating: 5, comment: "Commande bien emballée. Arrivée le jour prévu. Dispositif pour enlever le cérumen. Parfait, il est super. Il est impeccable. J'en ai déjà commandé deux autres pour ma famille. Je le recommande vivement. 💯 Merci.", date: "10 Février 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A8c05ba610b9e4c39a94983ce52fd71d2e.jpg_960x960q75.jpg_.avif"] },
      { id: 105, name: "Awa N.", location: "Kaolack", rating: 5, comment: "Je l'ai testé moi-même, tout est parfait, ça fonctionne à merveille. Le téléchargement et l'installation du programme sont très simples.", date: "18 Février 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A385d63cf52d54838ac5fe109c85b704ey.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Aa2596ac2e1fe4e2cad79d618d74005dco.jpg_960x960q75.jpg_.avif"] },
      { id: 106, name: "Seydou B.", location: "Dakar", rating: 5, comment: "Je ne l'ai pas encore essayé, mais ça a l'air bien... j'espère que ça fonctionnera bien.", date: "25 Février 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Ac5375ab15bb149179ef9b06d51d2ebfbn.jpg_960x960q75.jpg_.avif"] },
      { id: 107, name: "Astou C.", location: "Touba", rating: 5, comment: "Conforme à la description et reçu très rapidement.", date: "05 Mars 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A08a17ba948a545819b8d0b311a5145e6r.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A2620ecef5b3a4edfab16443d07089904P.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A99fa79fe276d47279b45c5ea4d89bb7b9.jpg_960x960q75.jpg_.avif"] },
      { id: 108, name: "Moussa S.", location: "Mbour", rating: 5, comment: "Tout est arrivé en bon état, il ne reste plus qu'à l'utiliser.", date: "12 Mars 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A27e455772a114036a36d17362af4d5b7Z.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A5422ab4a9a8d486b8475082dd581fc07q.jpg_960x960q75.jpg_.avif"] },
      { id: 109, name: "Khady G.", location: "Thiès", rating: 5, comment: "L'article est conforme à sa description.", date: "20 Mars 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Ac925be5dc7dd4bd69efafee006df6449h.jpg_960x960q75.jpg_.avif"] },
      { id: 110, name: "Ibrahima F.", location: "Louga", rating: 5, comment: "Le colis est arrivé en bon état et à la date prévue. Je vais télécharger l'application et la tester. Je recommande le vendeur.", date: "28 Mars 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Ad37cb9cbb2b74ff186e91b28c68447ae7.jpg_960x960q75.jpg_.avif"] },
      { id: 111, name: "Saliou N.", location: "Dakar", rating: 5, comment: "Un appareil très pratique, et la qualité d'image est également très bonne ; facile à utiliser.", date: "05 Avril 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Ae44ba4fc17704deb92f38d51db8b8752P.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Adadfed9250eb4911b19ea10a485d1256s.jpg_960x960q75.jpg_.avif"] },
      { id: 112, name: "Nafissatou D.", location: "Saint-Louis", rating: 5, comment: "Je recommande à 100% ! On voit exactement ce qu’on enlève, c’est satisfaisant 😍", date: "12 Avril 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Adf1690ae1edd42f5ba5dc49249825bfaa.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A1730f92cbe6f453f8539aceca4aba889M.jpg_960x960q75.jpg_.avif"] },
      { id: 113, name: "Cheikh S.", location: "Mbour", rating: 5, comment: "Merci, tout est arrivé en bon état, bien emballé, conforme à ma commande.", date: "19 Avril 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Ad3f6e39287a64f7a88b2eb00962839f07.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A9d2458027f7446fc985a807782c96c71W.jpg_960x960q75.jpg_.avif"] },
      { id: 114, name: "Fatou J.", location: "Thiès", rating: 5, comment: "Reçu rapidement et en bon état, la connexion à l'application n'a pas été très facile, mais elle a fini par fonctionner... merci au vendeur.", date: "26 Avril 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Aaa14ad91eb924f2ea550e7e15fa1e318a.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A7944213bbabc46a380cd15d8a6ba9feeI.jpg_960x960q75.jpg_.avif"] },
      { id: 115, name: "Moussa G.", location: "Dakar", rating: 5, comment: "Produit indispensable à la maison. Toute la famille l’utilise maintenant !", date: "03 Mai 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A2f813da4311d4edfa750a3f0a50c41c5a.jpg_960x960q75.jpg_.avif"] },
      { id: 116, name: "Awa S.", location: "Saint-Louis", rating: 4, comment: "C'est pas cher mais ça marche bien, haha. La qualité d'image est un peu décevante, mais on voit les oreilles.", date: "10 Mai 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/S88d82b14f766435b802a8811fc016eb35.jpg_960x960q75.jpg_.avif"] },
      { id: 117, name: "Omar D.", location: "Ziguinchor", rating: 5, comment: "J’ai économisé des visites chez le médecin grâce à ça. Hyper pratique.", date: "17 Mai 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Scd4a2638dd134966bc2211cdcc86f91dD.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Se8c8bca25378407d84882711aec61caca.jpg_960x960q75.jpg_.avif"] },
      { id: 118, name: "Bineta N.", location: "Kaolack", rating: 5, comment: "Il est facile à utiliser et fonctionne bien avec la connexion.", date: "24 Mai 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Sa6bca869f08e474faab0d5f932399e2b5.jpg_960x960q75.jpg_.avif"] },
      { id: 119, name: "Abdou K.", location: "Mbour", rating: 5, comment: "Est-ce vraiment possible de l'avoir à un prix aussi bas ? 😭 C'est vraiment incroyable ! J'avais l'impression de voir tous les pores de ma peau, non, vraiment !", date: "01 Juin 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Sd8c689bbf72f4fae8ae764b9a8a339ad6.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Saff963dc3fd04bbab5408ccab522244bG.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Seed62a3726a542f58aac6ec0a2a96b13V.jpg_960x960q75.jpg_.avif"] },
      { id: 120, name: "Mariama L.", location: "Touba", rating: 5, comment: "Produit d'excellente qualité, très fonctionnel", date: "08 Juin 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A8e4f8ce80aab47bab47ba680737235e40.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A45f1bebd59b0446189b71c592bba8d3a6.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A2706c118f7794223b8c7e4275047db51I.jpg_960x960q75.jpg_.avif"] },
      { id: 121, name: "Ibrahima F.", location: "Louga", rating: 5, comment: "Bien reçu, il ne reste plus qu'à le tester, il semble complet.", date: "15 Juin 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Ae4f928425073491bbc52a3c2cc6d92c5H.jpg_960x960q75.jpg_.avif"] },
      { id: 122, name: "Khady M.", location: "Richard-Toll", rating: 5, comment: "Colis reçu en bon état et fonctionnel. J'en suis satisfait.", date: "22 Juin 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Af1df0d19b630459ea764530ee5d94d05d.jpg_960x960q75.jpg_.avif"] },
      { id: 123, name: "Pape T.", location: "Kolda", rating: 5, comment: "Parfait, c'est magnifique.", date: "29 Juin 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A5b9a6164604e466ea071fc2abb496905z.jpg_960x960q75.jpg_.avif"] },
      { id: 124, name: "Cheikh S.", location: "Dakar", rating: 5, comment: "C'est vraiment agréable. Après une utilisation prolongée, une légère sensation de chaleur se fait sentir, mais c'est tout à fait normal.", date: "10 Juillet 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/S292c2cfd3e6d4c868bda0a27ecfeed65b.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Af5bab2e357d84aeaa74ca54cc8b07990l.jpg_960x960q75.jpg_.avif"] },
      { id: 125, name: "Seynobu J.", location: "Thiès", rating: 5, comment: "C'est formidable que le kit comprenne une variété d'outils.", date: "20 Juillet 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A8da3d7966c9d47f4b3de5f14bf7e4183h.jpg_960x960q75.jpg_.avif"] },
      { id: 126, name: "Nafissatou P.", location: "Saint-Louis", rating: 5, comment: "Très bien ! le livreur est arrivé en moins de 45 minutes", date: "30 Juillet 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A0e18191a26b1460985f21ced6b516d1ab.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Ae5dc468545ba4212ae9fba3b20d2014fA.jpg_960x960q75.jpg_.avif"] },
      { id: 127, name: "Ousmane B.", location: "Ziguinchor", rating: 5, comment: "Très bon produit, l'image est parfaitement claire (10/10).", date: "05 Août 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A256c8be2cff04e9a9f1051a47675d296x.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Abd5ca4088df74ac592e32c0e82fb7bc6a.jpg_960x960q75.jpg_.avif"] },
      { id: 128, name: "Saliou G.", location: "Kaolack", rating: 5, comment: "Très bon produit, il faut juste prendre le coup de main au début mais après c’est top.", date: "15 Août 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A0b2884055f764cbe8c8877bd170c087bt.jpg_960x960q75.jpg_.avif"] },
      { id: 129, name: "Nogaye C.", location: "Touba", rating: 5, comment: "Je suis vraiment surpris, excellent produit : utile et moins cher.", date: "25 Août 2025", images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A95f372c3593243bd8770803619b323d8q.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A920dd6f70d274f4c875002701462ac31N.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Acc8c6330cadb4b1b9078f90a7819742fF.jpg_960x960q75.jpg_.avif"] }
    ]
  },
  {
    id: 2,
    name: "Green Mask Stick | Masque Purifiant 🌱",
    price: 9900,
    originalPrice: 16900,
    image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEivyUqI1XCqj1GjbIiLwBtkpsFFpk5maoNLJgiyHPg_BQZRKOcOWEW-078xDzuk55AlUEJnBV_jMSNVIp9-nn2rt8nsp5WPRfbm1eG2bESx_oG1W16gV1gx9IB7gNFsVBFRXrnLxjyi4HBsXjbbJbRWip6sjOUBsyx4z-fAg4prnh72eWzIGFyZWEdgoG8/s800/3.jpg",
    images: [
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEivyUqI1XCqj1GjbIiLwBtkpsFFpk5maoNLJgiyHPg_BQZRKOcOWEW-078xDzuk55AlUEJnBV_jMSNVIp9-nn2rt8nsp5WPRfbm1eG2bESx_oG1W16gV1gx9IB7gNFsVBFRXrnLxjyi4HBsXjbbJbRWip6sjOUBsyx4z-fAg4prnh72eWzIGFyZWEdgoG8/s800/3.jpg",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi4VweXJ0Q04jpl8GLPiaotZ9JhFhN3WiRPlDzTw6vQNbD7J21RIQuUwn6uYjrn8WfXwaAIf2SFmi0wmqdxsdbNyL45ijyZw1DnHzoJuTHi5wBAvcUlYQov_NtqS7S47iSLfxyaWncsfHLXir9_UNXr33AFLj5gr2HIE2yT874lqIs2-IehyphenhyphenBnm31uLAOg/s320/4_49e7934b-490b-4051-bf50-f25bd962b0fb.webp",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhM07SfvpArUfo4RnMIPJG6F0ldcn4R7P4OXFurd9_V0lVPv0TzYuhFuC71WH5I1QKfv-N37YmwMXI5cMKn_4EfO20AmULVUFXYrr5UM2fTeLKeRsSkCClZvu3m04g_HtKOkKTbqjRm70pDljySZZF6JqehFHsWuC5e98-Jl84fnHMm4L98LL441kMzAak/s800/6_8423496b-aa50-4454-83a6-1c43eb7341ba.jpg",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEizgOdTgM4UFmWHbNzSJlWVE1_KEvz92FaZr_T_RWHTOE80f98e5-MrJ2LEoYc7ln_phssDI-MThcbElafIjRpPqIW4hta9i1hRhBXdZmJBuU9mgkIMPKFWFhokvVcJuyQcMSoBFG3AHbUn3FOcxcA4JNJNUrxbYF5d-xX5yJhzZS0k-7yMgWG-7vZ4JoM/s800/3_71e33039-8d85-4016-ac40-45845b3b9a4e.jpg",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj36Tf0vrc8rc5-96EwwKdCe_uy6vHq9Hlkbsyz1bRw5UDO1xJFP60y_Ox9wKaqSoYxLSWMtriekOmt1lJ11sI6Q-Y-aR_yIUGajS0bZ2gRN4TyN4Z_qsWXMQOd2DMBobG6Gudny4ABy7FtyxU2yPrfc3oPTLv6Rb13yPQiwL8JG_XSPQ_vuofduqKSGIE/s320/7_2bd73070-7590-45a9-b4ca-899b0bd9a1c2.webp",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiaTTBIFSTXnL_JNhLT-OF4w_1lGZR6tX5BQrl6kEV84sUVWa-qNgKTcs3S0-Sei-zzRPC4nXvlqKs5O2rk_5aC_yE0Y9IasoqnaQrD_PZnoL9xG97nt7_Th_1NmTe-kOoaSTUD7NF-xUg80YVcTT6vD7Y91BzIEb4W-CCqC5sGkZxmMNuV2yODP-mxElY/s320/5_a51cb518-6f17-47ff-9810-6e8e901b524d.webp"
    ],
    badge: "-41%",
    category: "Visage",
    description: "🌿 Purifiez votre peau, ✨ révélez votre éclat, 😌 simplifiez votre routine !\nLe Green Mask Stick nettoie la peau en profondeur, élimine l’excès de sébum, désincruste les pores et aide à réduire les points noirs, tout en hydratant la peau.\n\nPourquoi le choisir ?\n\n🌱 Nettoyage profond : élimine impuretés et excès de sébum\n\n✨ Réduit les points noirs et resserre les pores\n\n💧 Hydrate et nourrit la peau\n\n🖊️ Format stick : application facile, rapide et sans gâchis\n\n👜 Compact et transportable partout\n\nBienfaits :\n\n✨ Peau douce et éclatante\n\n🌿 Teint frais et purifié\n\n😌 Sensation de propreté immédiate\n\n💆‍♀️ Routine simple et efficace\n\n👨‍👩‍👦 Hommes & femmes\n\n🌿 Peaux grasses, mixtes et normales\n\n👦👧 Dès 12 ans\n\nMode d’emploi rapide :\n\n🧼 Nettoyez le visage\n\n🖊️ Appliquez le masque directement avec le stick\n\n⏳ Laissez poser 10 à 15 minutes\n\n💦 Rincez à l’eau tiède\n\n📅 Utilisation : 2 à 3 fois par semaine\n\n⏱️ Durée : 1 à 2 mois selon l’usage\n\n🌟 Une peau nette. Simplement. Naturellement.",
    rating: 4.7,
    reviewsCount: 4,
    slug: "green-mask-stick-purifiant",
    bundleOptions: [
      { quantity: 1, price: 9900 },
      { 
        quantity: 2, 
        price: 18000, 
        discountBadge: 'Économise 25% 🎁' 
      }
    ],
    reviews: []
  },
  {
    id: 3,
    name: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙",
    price: 9900,
    originalPrice: 13000,
    image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgSHeniE2SwlBtLgqsQbr38jxC1-iQnl3GQXVYeaR9k4ehwT7eDs5YZQP9cC3XpT_T79FD4vZ0ErcLU6F9pwq9Yu0MOBlpoIGtgioiLQHVtMno5bO7EDb7QJfL5O3M74ihCsrEkE_ytbC4fZC-O7Q39GU7PLyRVS81DLRGiyIxKcdDQ37UwfL5q_srrx8k/s400/1.jpg",
    images: [
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgSHeniE2SwlBtLgqsQbr38jxC1-iQnl3GQXVYeaR9k4ehwT7eDs5YZQP9cC3XpT_T79FD4vZ0ErcLU6F9pwq9Yu0MOBlpoIGtgioiLQHVtMno5bO7EDb7QJfL5O3M74ihCsrEkE_ytbC4fZC-O7Q39GU7PLyRVS81DLRGiyIxKcdDQ37UwfL5q_srrx8k/s400/1.jpg",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjsqI68JS4MZoznA_kCT7blo2f3Dg4WGzforG3dFJtaR_lWfUwaWOsNJJ4AQ4LKt9Rvig81zGXxn8gRlismmrHMsX-x6dGmzPFDxzcTQbgGMs8sLnKCMrj72kpieeCK_0JDqEPx97kbw58XeIn5vemUxKlyISBe2KsvcY8YT18joAVibB63_rYwfvLRxlA/s400/5.jpg",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhkNBPA5W9bl7rruYdmoqLB042FynYwfgN5i8JK8KB4jJH0JX-47evBjA1t8XH3EqMOblLUuYMFYjoC0spu9OYXGoat5LD-Aflt1dUz7Lt1L406Rbd02RN2QvK3ICRcYWg0bfy9DHA6pvBWwv-9ymKR3hiGp9AC0KeGS3LUYrm2yqXTDO8h-hpulatR7O0/s400/6_ba398d4c-2c37-4abe-a53b-04eb74304a06.jpg",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgCbZN5OkCIvN9fbZO8sSz-SfSNpTrKgSZ9vkq6TuEUUuCfxAxoDxxYHOEG2BOlsAj-fMgJOWxpvktymAtwHOUDQKhPbrjnVwXoCZW-e8xZ5QoCj1YeMwvYaVFR4tCi83YBRKqf1Pqd8urcz_uoKg7K4WfzgpLMR7sfCegAB14h94Fr_i-F5GB3u3bB7rI/s320/4_0caf2db9-247e-4ad2-b02a-b3a4ab238162.webp",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhVMdnUPTk9PECYdAuiCFRKo7EyDhlcdh0bwi2hkNDmEogIddSgF9aW5HwABtN1xGf6CTphwLrOd1INqZTuf5E0-q1R6R3mEt4l0FSU70Hlbn5cAOispvKsWw83o03oiRT7hI6y2F_sTtPbZk6YG0hW9xkiJrA82zuHg1FiUhwlK4_7xnGBUNflStpTquU/s320/7_458ab5e8-6811-4b9b-9ea9-5ae80ef79eb1.webp"
    ],
    badge: "-24%",
    category: "Visage",
    description: "🌙 Raffermissez votre peau, ✨ boostez l’hydratation, 😴 réveillez-vous éclatante !\nLe Masque au Collagène Lakerin agit pendant la nuit pour nourrir intensément la peau, améliorer son élasticité et lisser les signes de fatigue. Enrichi en collagène, il aide la peau à se régénérer pendant le sommeil.\n\nPourquoi le choisir ?\n\n✨ Collagène concentré : améliore fermeté et élasticité\n\n💧 Hydratation profonde et durable\n\n🌙 Action nocturne : agit pendant votre sommeil\n\n😌 Texture confortable, non collante\n\n🧴 Soin premium signé Lakerin\n\nBienfaits :\n\n✨ Peau plus ferme et rebondie\n\n🌸 Teint frais et lumineux au réveil\n\n😴 Réduction des signes de fatigue\n\n⏳ Apparence plus lisse et rajeunie\n\n💆‍♀️ Peau nourrie et revitalisée\n\n👨‍👩‍👦 Convient à tous\n\n🌿 Tous types de peau\n\n🌙 Idéal pour une routine de nuit",
    rating: 4.9,
    reviewsCount: 35,
    slug: "masque-collagene-lakerin",
    bundleOptions: [
      { quantity: 1, price: 9900 },
      { 
        quantity: 2, 
        price: 18000, 
        discountBadge: 'Économise 10% 🎁',
        isPopular: true 
      },
      { 
        quantity: 3, 
        price: 25000, 
        discountBadge: 'Économise 15% 🎁' 
      }
    ],
    reviews: []
  },
  {
    id: 4,
    name: "Savon au Curcuma | Purifiant 🚿",
    price: 9900,
    originalPrice: 14900,
    image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiw7qgPdyRlT7QxOpDGpM0B-iG2AZ1TtTPE00Eb9OrZGfD2CXpC5D4cO0BoIT1FGFGVRsLQqiMeJcODMrKh-tvJmpo_7F2VqK1sdPTNoa4N_yvN1MeDhSVI5darGZYK3Vjld2OyxvqQVLERoxbCQLHefpg2UuGmf8hlxAxmvc608CrUF9zli23qkVeub3k/s400/1-3.jpg",
    images: [
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiw7qgPdyRlT7QxOpDGpM0B-iG2AZ1TtTPE00Eb9OrZGfD2CXpC5D4cO0BoIT1FGFGVRsLQqiMeJcODMrKh-tvJmpo_7F2VqK1sdPTNoa4N_yvN1MeDhSVI5darGZYK3Vjld2OyxvqQVLERoxbCQLHefpg2UuGmf8hlxAxmvc608CrUF9zli23qkVeub3k/s400/1-3.jpg",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj8xCoWl7RkZ0VOyu5RySoyy_iqIUFaycUt4gqLML63pwDPtOQ9Hw2qMFROVZb6epZQHdVJ6ultP8-90V2SEN_YpFhTDDnOU0JieoyHMnZAbV26cyfaJLdHH0qIQWfq2jWOH18b4a0T_jMJ55hR2pKGe_-0ZRNBny2PJIzhPbAO_fJpraMzkQ6i44AlR9o/s400/3-3.jpg",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg0yUz7qL9fYZmJsUmwf473QZzfrAIx9QELxzS0UJcRE00c-MS1ZYbvrzqCEd39RWLEAzjvTLmgK_DT4lhSiQMgWli4EXerz8HviMX_J4QIoCm8xryFeByi9uAZHtgblE1xnV2e-_jBG5tDGRI3ECZtb8v5BrgoNkSdS8UWBYpuVmHHtD_G8hiuS4H4ZKU/s400/5_78faa186-2e89-4848-bfba-9c52b02018fc.jpg",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiTHNPFgUWERrYqLuVvs95HmXiv8lHR6KQb8AdKTGTgCPxkIMwuWkpGDK0mgCP0XP97tedPK61HlMFkFMSipN3CaojCsMHojG1M2UN3VSNYm2NqWomoUWs8NDrG8_JEIVDtb_-u87uM8eH2835XpGjme21X68MkjhftOXVEvBfvbY-KTZlg_WwikSv1QP4/s400/4_ac426578-ac63-4bf9-a4d3-89de122a9c9b.jpg",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgenON8-KSpyBJHLt_qz9-nsRABIYw3aSXRg82PzDnEAZ5AkmOTO1LeqMf74crWAfQvsiqI8pnTGLjWYN0zMsgK4IxV14hMEPMWjSWwX9LAKzF5xnhH97tQl4F-2PnLyMaJAjkL4Q_tPb5xgpshnRqyaGB9ZJgHk0TUdno-Rn-d92XlvPDBh-9sOQz-90I/s400/3_b1338628-3879-4a82-ba57-671747d81ad9.jpg",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiT6an5GfulnTj6I5dIZt25kOqmx2O_QEVnID2eoZsgzgyl31iWz7ffAQ5cosnk_4H3JTjh6Qmf1Q7xTR7ESJu6h4-8bIX8x0jJtAgKOkmnZ93Mj-sey4jcGZ0E6K3ASK90XHLfbMxz2WiySlLjGE5NasXZxHBonFgt6mjW5Cxz1256s1lENfNhsJO0NIs/s320/2_3f6e9b2b-9b19-43e5-b418-a75d1f053ed1.webp",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhMIcCVNsR4GopfspuUh2McbpZAMaCNn8fHwo-vlRaLR7YvVkll3pmpzoc70UxwQ1aVgi6Z3H4Ukjr1NlWdB_30G8-vzXUKOdvQhtN0wzfuCz-vjyJcPEtd_jUzJUWhautsgyU-tmldCOy0o2Aun16DkeAsu4Qxq4HcJWj5uVfpVeDBDA9XJHL-j1gkH34/s400/2-3.jpg",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj8MedjCx-ToYJvWAgqYUJ-ejqmRgbY1M7DEG_2ErBWBGF8hev0J1hOQIlbLtPYMxwCst2cp4UP2SUvt36tSIS9fIN4iXrDgUSiIlXlS28iUx4YEqwgOH55Wm179Z9jkwjYMz1WARaM1QRBr__QJceyZ2W_4d4KXa7qoYoBNbKuqt_YuoJfXTbwdv8IAj0/s400/6-2.jpg",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhOWxZc3PMWhUwBtnmIYEtpYSgI9ypujZjToexZB5F4ZwkC9lG41qnWFhVfi2tJZQbnpnVBpNfSFZG3qJluaVlKxmoITPjjGl7NmHod4xDWfhO8Tz2Lw0wyQ6D0cS6ukOvHCKcDWjxPnLZy56jvuNUYCoklJZpLWiJWbdLgG3jM9HhBoulSeCSSr-IaPU8/s400/5-3.jpg",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgHF98oCZq30tAe4ea6gnpFE7ky4jMrVmkov0FD3fzIoqiG-67JkP3_NQ66dAjohoSVipOdkc8APYQ5HEp9yJmjnprm6-q4oSRnobGKmobFFqUjvctCHzhXQsZA-CwWsmxrRWTrnESpwKw6APmTkwjgcf8Ng5SvojmPvT2wRjYB6islyKDyuPWqPpVxsak/s400/4-3.jpg"
    ],
    badge: "-34%",
    category: "Corps",
    description: "Illuminez votre peau, 🌿 unifiez votre teint, ✨ révélez votre éclat naturel !\nLe Savon Éclaircissant au Curcuma nettoie la peau en douceur tout en aidant à réduire les taches, unifier le teint et redonner de l’éclat. Enrichi au curcuma, reconnu pour ses propriétés purifiantes et éclaircissantes, il convient parfaitement à un usage quotidien.\n\nPourquoi le choisir ?\n\n🌿 Curcuma naturel : aide à éclaircir et unifier la peau\n\n🚿 Nettoyage doux et efficace\n\n✨ Aide à réduire les taches and imperfections\n\n🧼 Convient au visage et au corps\n\n🌬️ Respecte l’équilibre de la peau\n\nBienfaits :\n\n✨ Teint plus lumineux et uniforme\n\n🌸 Peau propre, fraîche et revitalisée\n\n😌 Réduction des imperfections visibles\n\n🌿 Sensation de douceur après chaque utilisation\n\n👨👩 Convient à tous\n\n🌿 Tous types de peau\n\n📆 Utilisation quotidienne possible\n\nMode d’emploi rapide :\n\n🚿 Mouillez la peau\n\n🧼 Faites mousser le savon\n\n✨ Massez délicatement le visage ou le corps\n\n💦 Rincez abondamment\n\n🌿 Utilisez matin et soir\n\n🌟 Une peau plus claire. Un teint unifié. Une fraîcheur naturelle.",
    rating: 4.6,
    reviewsCount: 20,
    slug: "savon-curcuma",
    bundleOptions: [
      { quantity: 1, price: 9900 },
      { 
        quantity: 2, 
        price: 18000, 
        discountBadge: 'Économise 15% 🎁',
        isPopular: true 
      },
      { 
        quantity: 3, 
        price: 25000, 
        discountBadge: 'Économise 25% 🎁' 
      }
    ]
  },
  {
    id: 5,
    name: "Rasoir Électrique Tête Rotative 🚀",
    price: 9900,
    originalPrice: 15000,
    image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj0Lw2aKVk_AtRkLDYREpz9uvwWebbXFWjUIgV2N0mHGMtGzEswXA-veT6KAnzmEVXOAAfPQauYFUucub66-y5g33rlxKSsIgg2iQqEw7TtfgW21H2LGRyM1q3AjIevW-xJbyNiHaAhaG3jlLc9OyMQ9KTCxRxAf1d48pFP_fIhHocCLozEXrkJjEMIDzo/s400/1_a7c1a83e-e8dc-4893-878f-449d0041330f.jpg",
    images: [
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj0Lw2aKVk_AtRkLDYREpz9uvwWebbXFWjUIgV2N0mHGMtGzEswXA-veT6KAnzmEVXOAAfPQauYFUucub66-y5g33rlxKSsIgg2iQqEw7TtfgW21H2LGRyM1q3AjIevW-xJbyNiHaAhaG3jlLc9OyMQ9KTCxRxAf1d48pFP_fIhHocCLozEXrkJjEMIDzo/s400/1_a7c1a83e-e8dc-4893-878f-449d0041330f.jpg",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgPZ0e6cnFcGDx06Fzfsf6Df20GPmU-uMWH-D9DkqUtREFDYKy1OdH7IZlNONsYIxXsZNNTLzl0b7_Njt-nTwft0zV4wNTZKyve-lcMlvo94ZSBvld-p3VAfEH2tcUuPEzJeXZ-pCV5t3IHmjv36NrFyvUyxa-uzma6E0KQiB-LV-tArNooSw7GWJHI-io/s400/5_417f3acb-72e8-4113-a3f3-98c557fa56c5.jpg",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhm4yMlXsFk2cH9dFfaL1cye8SCJoBaRUFNGemSzs1FEIXVh1XkOe5vEFs0PhLGaPJwH9OwEarzafI0uoZmfe1G4ChADcShAxiiag8eh_IIH8wk5-dPAK2KuSe1rfMemVP66JiE6THfLVgCmdAETbU9DH9-018XYQmAtY-So9G01Vz6K7CQA1Z2hhYzFGA/s400/2_1db71637-7ba9-41f8-8158-5026aef8d28d.jpg",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiQWSRfiKuSjQyE0mat3PBkPcruJwAKsCfnHM69Ih8v8X6PrK9Q8X9_viT0JLQU6Bvbr-e_-araFkoZfeJoAyfxJ6JMxRPn9UkBYNzWdNM_QiAUC0ShlaEoSsnFzjhman9vDOKG_pBklv0PYrdPTAKbDgkvGjQ2uhsdiQuyTDNYhxTLHqHz2DAKe_aUywA/s400/3_3b8a07cd-d581-4bf5-a9f0-e8851648af92.jpg",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi3A6iRICD9JQNdXalTYo2ZrKBESmwdiN7iCpua0O4tDm58O1fUJNuA-Jd5m_0CECng94vNZc21uFbRtPTsw1XOc5lpf4QRLuKYULMgkVu5zUH_L-wvNSQtyy6g1avpdHUjAnlls2GTckEZA_bvSRVrTM2qNbiy65O0MU3zcma_PDW_hB7cd0gygm-0Jmg/s400/6_13a8938d-d449-4999-8c8d-ac847efb685e.jpg",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj2Pzwn48p3kiYHZrnte2wYoWcPrLGFsdj3yYsbAXU411mMxxdLsNMs1xCsnt60nspzbMgeqHICsF705IAy_sV7_T-auynSOIdf4pvKxIW3k_Keoz5WHnF36nnksaB3qYUN68GzfO1b78P0M5djsF_oQLWkuFftaEC0DubFEpf5z1FqdYMMwLhRQr4_I0o/s400/4_09ca2204-ae5d-4cdc-8ee9-b58a503ddf85.jpg",
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhR45CVDW1vp5SI5KvphKXblN0NBIOgSH7_pl2kNrl9H23wJfx72w4Ovx1eRxiWTN35UVOjQzkqthDwAhAY0BQb2Q8tLVYCQGEQUPiW8soD7wqfLH7XTSjzTf1Kjrbd6Vbf7pPGoPdF_CKnpEda-7MVXULit9RTb-LOxA7VZMRXQkkKPF7Zs58OhePsJ8U/s400/7.jpg"
    ],
    badge: "-34%",
    category: "High-Tech",
    description: "✨ Rasez mieux, 😌 protégez votre peau, 💼 gagnez du temps !\nNotre rasoir électrique intelligent nouvelle génération offre un rasage rapide, net et confortable. Sa tête rotative en acier inoxydable épouse parfaitement les contours du visage pour éliminer les poils efficacement, sans irritation.\n\nPourquoi le choisir ?\n\n🪒 Tête rotative ultra-précise : s’adapte aux contours du visage\n\n🔥 Rasage doux sans coupures ni rougeurs\n\n📊 Écran LED intelligent : affiche la batterie en pourcentage\n\n🔋 Batterie longue durée + recharge USB rapide\n\n💎 Design moderne, compact et ergonomique\n\nBienfaits :\n\n😌 Peau douce et lisse après chaque rasage\n\n🛡️ Zéro irritation, even for peaux sensibles\n\n⚡ Rasage rapide et efficace en un seul passage\n\n✈️ Parfait pour la maison et les déplacements\n\n👨🦱 Conçu pour les hommes\n\n👦 Dès 12 ans\n\nMode d’emploi rapide :\n\n🔘 Allumez le rasoir avec le bouton unique\n\n🪒 Rasez délicatement en mouvements circulaires\n\n💦 Retirez la tête et rincez à l’eau après usage\n\n🔌 Rechargez via USB si nécessaire\n\n🌟 Un rasage net. Une peau protégée. Un confort total.",
    rating: 4.8,
    reviewsCount: 19,
    slug: "rasoir-electrique",
    bundleOptions: [
      { quantity: 1, price: 9900 },
      { 
        quantity: 2, 
        price: 18000, 
        discountBadge: 'Économise 10% 🎁',
        isPopular: true 
      },
      { 
        quantity: 3, 
        price: 25000, 
        discountBadge: 'Économise 15% 🎁' 
      }
    ]
  }
];

const CATEGORIES = [
  { image: "https://i.pinimg.com/736x/be/2d/13/be2d13d49b690816ebab388a24fae55d.jpg", label: "Visage" },
  { image: "https://i.pinimg.com/736x/ce/b7/38/ceb738f4d29f6ac525bca0877745434a.jpg", label: "Corps" },
  { image: "https://i.pinimg.com/736x/21/4f/67/214f677ab9c1b133ce2b138ad3caf601.jpg", label: "Hygiène" },
  { image: "https://i.pinimg.com/736x/0c/89/4f/0c894fecdad22c0eb98261c0fcdfb597.jpg", label: "Gadgets" },
];

const SLIDES = [
  {
    tag: "",
    title: "",
    sub: "",
    image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhxeFoY-0lLd_dw_G2KYvVo5g_JbLNNwzuv2-8Qk38b9-IccHx6tCOT9rLuLjAR3CmBdShWx2eX_AoNC2GsKDuXzm5GCn5GbAHpQT1GlweanSfdTNAgFjQx9l2P2_b45mYQv6C4yc3aHLO6rqTDrre_5tOiPx2l_f_6m2_pH0ckYZvaRUlPKXpFEO4nq58/s400/3.png"
  },
  {
    tag: "",
    title: "",
    sub: "",
    image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhrq2pj_4vvCc8yuSK1i8RTbfsesVyEaGkvHHG-rOCNlicFP46DvdpJ3msQz8RfhnWA0KULZOafkxZrcCWmxayIs9jxZwp3sSz67XveAWTooVtKHkJcwE-mDePcozlUC6n_D0RHMmakg7_wvVNneMygyfmZVM-wiGuadzWbnMxJputm68QxL-5_u0EWc10/s400/2.png"
  },
  {
    tag: "",
    title: "",
    sub: "",
    image: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjWjaB9sIUUTj4885I80eSVAl3dKZP_Afosf-ZpW3TzLS66BdjrfNKcPBhWD_bLM1zPZ9MUQbyb5Vz0e77FnWy74YkFIUR2uhSylKdbNjsHb3gzXRFmJfZZ9dBjSneeZ5OIbbu334GJGg3SZ2B6yHXW-Ek3h1wM7FX7khxQTcxzePu2fkLtqUFccIihkOU/s400/1.png"
  }
];

const REVIEWS = [
  {
    id: 1,
    name: "Samba L.",
    location: "Dakar",
    rating: 5,
    comment: "La connexion au téléphone s'est faite sans problème. Franchement, l'appareil est agréable à prendre en main : sa forme et son poids sont similaires à ceux d'un marqueur.",
    date: "25 Avril 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Aceecc52189bf42e08a92d2a98f6cb99eC.jpg_400x400q50.jpg",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Ae322209a1588492da5a303df9b16f986Y.jpg_400x400q50.jpg",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A29cc09ce296440bfaa572b4f79a10207g.jpg_400x400q50.jpg"
    ],
    productName: "Kit de Nettoyeur d’Oreille ✨"
  },
  {
    id: 2,
    name: "Khady G.",
    location: "Thiès",
    rating: 5,
    comment: "Facile à installer, contrairement à d'autres endoscopes filaires qui n'ont jamais fonctionné correctement sur mon téléphone (trop ancien pour l'application).",
    date: "18 Avril 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A3ec9aa8356a9442784f038f2d28c1f32s.jpg_400x400q50.jpg",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A8ee35e6959b64921b54ff96250f834ccQ.jpg_400x400q50.jpg"
    ],
    productName: "Kit de Nettoyeur d’Oreille ✨"
  },
  {
    id: 3,
    name: "Abdoulaye S.",
    location: "Dakar",
    rating: 5,
    comment: "Le produit remplit parfaitement sa fonction, j'en suis très satisfait, même s'il nécessite un peu de pratique car il est difficile à manier lors de la première utilisation.",
    date: "10 Avril 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A5926c8e65acd46819d5743ff9a00b8ffv.jpg_960x960q75.jpg_.avif"
    ],
    productName: "Kit de Nettoyeur d’Oreille ✨"
  },
  {
    id: 4,
    name: "Awa N.",
    location: "Mbour",
    rating: 5,
    comment: "Très bon produit, vraiment excellent, l'appareil photo est excellent, j'en suis très satisfait, je l'ai beaucoup aimé.",
    date: "02 Avril 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A334981f9f48b49869ad3c91e75dd9244b.jpg_960x960q75.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Abf1b72cc43f746fda3be69e4187fb0caf.jpg_960x960q75.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A7a832c96d89044ccbd4e9a73e3f36e28l.jpg_960x960q75.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A363fb572fd2b4382adbcabf827d84b91q.jpg_960x960q75.jpg_.avif"
    ],
    productName: "Kit de Nettoyeur d’Oreille ✨"
  },
  {
    id: 5,
    name: "Ami D.",
    location: "Dakar",
    rating: 5,
    comment: "Je l’ai testé après avoir vu une pub… et honnêtement surprise 😳 Ma peau est beaucoup plus propre dès la première utilisation.",
    date: "14 Janvier 2026",
    image: "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/S4ad1f9d80a334ede8e248c1fd885bcaay.jpg_400x400q50.jpg_.avif",
    productName: "Green Mask Stick | Masque Purifiant 🌱"
  },
  {
    id: 6,
    name: "Safiétou K.",
    location: "Mbour",
    rating: 5,
    comment: "Après environ 15 minutes d'application, rincez à l'eau claire. La peau est rafraîchie et nette, les pores respirent et les points noirs sont visiblement réduits.",
    date: "28 Janvier 2026",
    image: "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Sb9efa017c20d474db186cb9741a32e34i.jpg_400x400q50.jpg_.avif",
    productName: "Green Mask Stick | Masque Purifiant 🌱"
  },
  {
    id: 7,
    name: "Modou S.",
    location: "Thiès",
    rating: 5,
    comment: "J'en ai acheter 3 et j’étais sceptique… mais après 2-3 utilisations, j’ai vraiment vu une différence.",
    date: "12 Février 2026",
    image: "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Sd18fb08f3369496b80dbf06becba161fO.jpg_400x400q50.jpg_.avif",
    productName: "Green Mask Stick | Masque Purifiant 🌱"
  },
  {
    id: 8,
    name: "Yacine N.",
    location: "Dakar",
    rating: 5,
    comment: "Les points noirs non irritants pour la peau disparaîtront d'eux-mêmes, et après le lavage, les pores seront moins nombreux et plus resserrés.",
    date: "25 Février 2026",
    image: "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/S0f3f7785497b452fbb766e5a9c353f47j.jpg_400x400q50.jpg_.avif",
    productName: "Green Mask Stick | Masque Purifiant 🌱"
  },
  {
    id: 9,
    name: "Aïda N.",
    location: "Dakar",
    rating: 5,
    comment: "Je recommande vivement ce vendeur. Le produit est conforme à sa description. Je suis ravie d'avoir reçu ma commande.",
    date: "15 Janvier 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Af8f1fa024cb24e4f8dad3e9f78d8b812n.jpg_400x400q50.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A59eedd256aab409d8ff717957bcda6812.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 11,
    name: "Binetou D.",
    location: "Saint-Louis",
    rating: 5,
    comment: "Livraison rapide, produit conforme à la description, je recommande ce magasin à 100%",
    date: "02 Février 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Acc15ac50cc1540dea9f7974fe0cdf1c54.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 12,
    name: "Ousmane S.",
    location: "Dakar",
    rating: 4,
    comment: "Le masque pénètre bien et lisse la peau. Sa texture collante est désagréable, il dessèche et tiraille la peau, ce qui est désagréable. Mais il est efficace.",
    date: "20 Février 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Affe539b9d50b41a183d756b793b1a4a35.jpg_400x400q50.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A43c364dd48174d5982c4164b4ef2fddbg.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 13,
    name: "Abdou L.",
    location: "Ziguinchor",
    rating: 5,
    comment: "Ça a l'air bien. Je ne l'ai pas encore utilisé, mais j'ai hâte de l'essayer. À porter la nuit, il s'enlève le matin.",
    date: "10 Mars 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Aff57d494dc7e4adb9f640129e8e66f09J.jpg_400x400q50.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A687c16c24545442cb0593935e49fd6d4j.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 14,
    name: "Amy C.",
    location: "Dakar",
    rating: 5,
    comment: "Ce que j’ai remarqué, c’est surtout l’hydratation au réveil. Et ça fait déjà beaucoup.",
    date: "28 Mars 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A4c8132bf8ba64818a3c82a79badf17c5Z.jpg_400x400q50.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A00c97c4178ff4355b9c10517217913cbP.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 15,
    name: "Rama N.",
    location: "Thiès",
    rating: 4,
    comment: "Elle n'a pas une odeur agréable. Le masque en gel est un peu liquide, mais l'application est très facile. Il est efficace contre l'acné. On ne ressent aucune gêne pendant le sommeil.",
    date: "12 Avril 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A34b2c5574135456db450aee3fe8f8e88z.jpg_400x400q50.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A32519b03394744b9a96d69b002d0866aj.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 16,
    name: "Ndèye F.",
    location: "Saint-Louis",
    rating: 5,
    comment: "Je ne suis pas fan des routines longues… là, juste appliquer et dormir. Et pourtant, le résultat est là.",
    date: "25 Avril 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A687c16c24545442cb0593935e49fd6d4j.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 17,
    name: "Coumba S.",
    location: "Ziguinchor",
    rating: 5,
    comment: "Je l’utilise 2 à 3 fois par semaine… c’est devenu un bon réflexe pour garder une peau propre.",
    date: "05 Mai 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A890c37488c6841389ec543f9299606b3S.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 19,
    name: "Khadija T.",
    location: "Touba",
    rating: 5,
    comment: "Livraison rapide, produit conforme à la description, le stick est très facile à utiliser !",
    date: "20 Mai 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A637134955b7b47eab8629f3fc7a663fbo.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 20,
    name: "Anta B.",
    location: "Kaolack",
    rating: 5,
    comment: "Je l’utilise les soirs où ma peau est “fatiguée”… et à chaque fois, le matin est une bonne surprise.",
    date: "05 Juin 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Acd77d7b07ade45eeaba65793a4baf277k.jpg_400x400q50.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A48ac39c10fcd44978e44d517b946a070r.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 22,
    name: "Fama G.",
    location: "Thiès",
    rating: 5,
    comment: "Bon produit, j'ai hâte de l'essayer ce soir sur mes points noirs.",
    date: "18 Juin 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A5bbec6e41fbd41b992834d26ae7e58664.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 23,
    name: "Seynabou K.",
    location: "Mbour",
    rating: 5,
    comment: "Un produit simple, sans promesses exagérées. Le stick est top pour ne pas s'en mettre partout.",
    date: "30 Juin 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Afab0f245df5a4f36a284e5528c28d02cK.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 24,
    name: "Adji S.",
    location: "Dakar",
    rating: 5,
    comment: "Avant : manque d’éclat\nAprès : peau plus lumineuse, sans effet miracle",
    date: "12 Juillet 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A93c3cfd0ff9c45fcafe25b51c1391cbaY.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 25,
    name: "Seynabou K.",
    location: "Mbour",
    rating: 5,
    comment: "Un produit simple, sans promesses exagérées. Le stick est top pour ne pas s'en mettre partout.",
    date: "12 Avril 2026",
    images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A3d9972220e274e94915944e3db0ddcaal.jpg_400x400q50.jpg_.avif"],
    productName: "Kit de Nettoyeur d’Oreille ✨"
  },
  {
    id: 26,
    name: "Fatim Z.",
    location: "Dakar",
    rating: 5,
    comment: "J'adore ce savon ! Il m'a permis d'obtenir un teint uniforme et de rendre ma peau douce. Aucune sensation de brûlure ni d'irritation. Un vrai bienfait pour la peau.",
    date: "18 Avril 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A1e50a5e1109f44868c59388cebecde92J.jpg_400x400q50.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A0b3c90f7b66545e7813d8bb3da371b4aS.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Savon au Curcuma | Purifiant 🚿"
  },
  {
    id: 27,
    name: "Ousmane C.",
    location: "Saint-Louis",
    rating: 5,
    comment: "J'ai reçu les savons au curcuma et au citron en bon état, je remercie le vendeur et le recommande vivement.",
    date: "05 Avril 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A48c57f9544884e668815583b63102e18F.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Savon au Curcuma | Purifiant 🚿"
  },
  {
    id: 30,
    name: "Awa B.",
    location: "Thiès",
    rating: 5,
    comment: "Reçu très rapidement. J'ai très hâte de l'essayer. Le savon est plus petit que prévu, je recommande donc d'en acheter plusieurs...",
    date: "25 Mars 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A2fd0f2bdb55a4ad58fc8cc4e0b60101d6.jpg_400x400q50.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Abefff08ab1a84861b03f283d42a93fb7o.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Savon au Curcuma | Purifiant 🚿"
  },
  {
    id: 31,
    name: "Ibrahima J.",
    location: "Ziguinchor",
    rating: 5,
    comment: "Je recommande de les utiliser car elles procurent une sensation de propreté et aident à assécher les petites plaies dues au psoriasis, offrant un soulagement léger.",
    date: "10 Mars 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A62670bf5e1a64446a72dfe486d73246dB.jpg_400x400q50.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A1d24e45657f54860b727d04486ecccedw.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Savon au Curcuma | Purifiant 🚿"
  },
  {
    id: 32,
    name: "Penda M.",
    location: "Diourbel",
    rating: 5,
    comment: "Très bon savon, il sent bon et donne de la brillance.",
    date: "01 Mars 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A737640e4c46c4dbaa328cb4155f789c7u.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Savon au Curcuma | Purifiant 🚿"
  },
  {
    id: 33,
    name: "Abdou L.",
    location: "Kaolack",
    rating: 5,
    comment: "C'est absolument merveilleux, ça donne au visage un éclat radieux. Je l'ai tellement adoré que je le recommande vivement. 🤩🤩",
    date: "15 Février 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A7d2f723b9fd940ff9c9590cb63200d54y.jpg_400x400q50.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A2a75152bc16149d988da2a860bc08135r.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Savon au Curcuma | Purifiant 🚿"
  },
  {
    id: 34,
    name: "Aminata F.",
    location: "Louga",
    rating: 5,
    comment: "C'est super, je l'ai utilisé et ça sent tellement bon, c'est vraiment doux pour la peau et je n'ai eu aucun problème jusqu'à présent.",
    date: "01 Février 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A2b834f42935e4eb2be7f2b13817087e6r.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Savon au Curcuma | Purifiant 🚿"
  },
  {
    id: 35,
    name: "Ndèye F.",
    location: "Fatick",
    rating: 5,
    comment: "Reçu en bon état, il sent fortement le gingembre mais sinon tout est propre. Hydratez bien votre peau après utilisation, même si elle est douce au toucher.",
    date: "15 Janvier 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Adf74c57f18a64a99b2653e74a0877200O.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Savon au Curcuma | Purifiant 🚿"
  },
  {
    id: 36,
    name: "Cheikh T.",
    location: "Mbour",
    rating: 5,
    comment: "Génial ! Ma commande est arrivée très rapidement et ces savons subliment ma peau jour après jour. Je les recommande vraiment.",
    date: "01 Janvier 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A16ac8551df3f4336b7a741bed78424c2I.jpg_400x400q50.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Af301934fd4a34b78bfde719b21c9dc4fC.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Savon au Curcuma | Purifiant 🚿"
  },
  {
    id: 37,
    name: "Rokhaya G.",
    location: "Dakar",
    rating: 5,
    comment: "Ce savon en barre est excellent pour le visage, surtout s'il est gras : il le rend doux et éclatant et atténue les taches brunes.",
    date: "15 Décembre 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Aab55a82286b54516a37281a78bf13711Z.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Savon au Curcuma | Purifiant 🚿"
  },
  {
    id: 38,
    name: "Alassane K.",
    location: "Richard-Toll",
    rating: 5,
    comment: "Ce savon sent tellement bon que c'est le seul type de savon que j'utilise réellement.",
    date: "01 Décembre 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A2be32d945b064f8892870ace4f680c59N.jpg_400x400q50.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A7d499d6aef0b4049a16fd84d7dd60ef9P.jpg_400x400q50.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A4fa3e043e0f643b3826e54e18e8b1c59d.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Savon au Curcuma | Purifiant 🚿"
  },
  {
    id: 39,
    name: "Haby S.",
    location: "Dakar",
    rating: 5,
    comment: "Je l’ai testé sans grande attente… après quelques jours, j’ai remarqué que mon teint était plus clair et uniforme. J’ai continué, et maintenant je ne peux plus m’en passer.",
    date: "15 Novembre 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A1b06faa71fdf4fccb9ee4a306b326be8N.jpg_400x400q50.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Afd246d26180b4745afca643d43789d37B.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Savon au Curcuma | Purifiant 🚿"
  },
  {
    id: 40,
    name: "Aïcha B.",
    location: "Dakar",
    rating: 5,
    comment: "Produit génial, sent bon et laisse une agréable sensation après utilisation… Effet placebo peut-être, mais peu importe… je l’aime et je le recommande",
    date: "25 Avril 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Aa7cc4b2770cd40a899fa311147397f01v.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Savon au Curcuma | Purifiant 🚿"
  },
  {
    id: 41,
    name: "Moussa S.",
    location: "Kaolack",
    rating: 5,
    comment: "J'adore ce savon. Ma peau est plus nette et incroyablement douce !",
    date: "18 Avril 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A3203aff5287a4b1da9234d8bca007cf8r.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Savon au Curcuma | Purifiant 🚿"
  },
  {
    id: 42,
    name: "Khady N.",
    location: "Thiès",
    rating: 5,
    comment: "Mes taches brunes et mon acné ont disparu en moins de 4 semaines.",
    date: "10 Avril 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Aa27ca3a0fcbf4abb96c2d8f1821032bf6.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Savon au Curcuma | Purifiant 🚿"
  },
  {
    id: 43,
    name: "Babacar D.",
    location: "Saint-Louis",
    rating: 5,
    comment: "Très efficace pour les taches brunes",
    date: "02 Avril 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A79b1f058420e456c8153b7debb0ef5578.jpg_400x400q50.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Ae1ba517d1e974b368346a543b60548d6N.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Savon au Curcuma | Purifiant 🚿"
  },
  {
    id: 44,
    name: "Safiétou C.",
    location: "Mbour",
    rating: 5,
    comment: "Super !! Première douche avec ce savon… sensation de peau propre incroyable. Au fil des utilisations, ma peau est devenue plus lumineuse ✨",
    date: "01 Avril 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Ac6a440b026f747159497a67e3da3b607N.jpg_400x400q50.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A2ed2f8eec65b46449c0a6440626fb1c6D.jpg_400x400q50.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Ae0d470f4871b40a6932ff85ed7d3d044l.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Savon au Curcuma | Purifiant 🚿"
  },
  {
    id: 45,
    name: "Ibrahima G.",
    location: "Dakar",
    rating: 5,
    comment: "Comme toujours, parfait ! Livraison ultra-rapide, qualité irréprochable, vendeur au top… Je repasserai commande avec plaisir.",
    date: "15 Mars 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A4228f1954df24f3a9189f388106703b28.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Savon au Curcuma | Purifiant 🚿"
  },
  {
    id: 46,
    name: "Cheikh T.",
    location: "Dakar",
    rating: 5,
    comment: "Le port USB-C est pratique. Même pour une barbe fine, la coupe est impeccable. De plus, son format compact le rend facile à transporter.",
    date: "14 Avril 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/S6f9685a7537f407597a680e5006b862e2.jpg_400x400q50.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Sbe677021ae754d7abef72edccac5b405c.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Rasoir Électrique Tête Rotative 🚀"
  },

  {
    id: 48,
    name: "Ibrahima S.",
    location: "Thiès",
    rating: 5,
    comment: "En voyage, c’est devenu mon indispensable. Petit, discret, mais super efficace.",
    date: "02 Avril 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/S97ce0623164b41d7bf48b77bb863313b7.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Rasoir Électrique Tête Rotative 🚀"
  },
  {
    id: 49,
    name: "Babacar N.",
    location: "Touba",
    rating: 5,
    comment: "Je ne pensais pas que ça raserait aussi bien vu la taille… grosse surprise.",
    date: "25 Mars 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/S5c962f25bf994852b5223690315cb913s.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Rasoir Électrique Tête Rotative 🚀"
  },
  {
    id: 50,
    name: "Ousmane D.",
    location: "Ziguinchor",
    rating: 5,
    comment: "Un bouton, ça démarre, et ça fait le job. Simple et efficace.",
    date: "10 Mars 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A9f00fe85c9534353b613dc018c36b7f2m.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Rasoir Électrique Tête Rotative 🚀"
  },
  {
    id: 51,
    name: "Moussa K.",
    location: "Kaolack",
    rating: 5,
    comment: "Cet article fonctionne très bien compte tenu de sa légèreté. Je l'ai utilisé dès sa réception ! Il sera très pratique pour mon voyage car je n'aurai pas besoin d'emporter mon rasoir japonais coûteux.",
    date: "28 Février 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Aeeee7ce286c6472b9e3491e2d941c755u.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Rasoir Électrique Tête Rotative 🚀"
  },
  {
    id: 52,
    name: "Abdou M.",
    location: "Dakar",
    rating: 5,
    comment: "Excellent produit, je le recommande 😏",
    date: "14 Février 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A0a5194fa2e7140c9a2bb625572d87c19v.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Rasoir Électrique Tête Rotative 🚀"
  },
  {
    id: 53,
    name: "Malick G.",
    location: "Mbour",
    rating: 5,
    comment: "Très utile et pratique, il est arrivé très rapidement, merci beaucoup.",
    date: "01 Février 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A03da66aaf549432cb13692742cda7fb22.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Rasoir Électrique Tête Rotative 🚀"
  },
  {
    id: 54,
    name: "Amadou S.",
    location: "Louga",
    rating: 3,
    comment: "J'ai reçu 3 lots. Seuls 2 fonctionnent ; le lot bleu est défectueux. Je souhaite donc demander un retour et un remboursement pour ce lot.",
    date: "15 Janvier 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Ad053e5c0698b4850b26c2d838ec6d619C.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Rasoir Électrique Tête Rotative 🚀"
  },
  {
    id: 55,
    name: "Seydou B.",
    location: "Dakar",
    rating: 5,
    comment: "C'est un super petit rasoir. Rechargeable. Utilisable partout. Il glisse parfaitement sur la peau, sans provoquer d'irritations ni de rougeurs. Livré avec tout le nécessaire pour le nettoyer : un petit chargeur USB-C et une petite brosse.",
    date: "01 Janvier 2026",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A378d452b69b4456eaffae29b5499549dK.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Rasoir Électrique Tête Rotative 🚀"
  },
  {
    id: 56,
    name: "Pape L.",
    location: "Rufisque",
    rating: 5,
    comment: "Livraison rapide. Bonne qualité. Fonctionne sur batterie interne. Livré chargé. Poids : 213 grammes. Rasage impeccable. Excellent rapport qualité-prix, emballage soigné, aucun dommage ni casse, livraison rapide.",
    date: "15 Décembre 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Abc3478cf063e43d3901f3d3b246e2fbaV.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Rasoir Électrique Tête Rotative 🚀"
  },
  {
    id: 57,
    name: "Omar K.",
    location: "Dakar",
    rating: 5,
    comment: "Excellent rasoir. Il fonctionne à merveille. Rasoir robuste et fonctionnel. Prix juste. En seulement 2 minutes, je me suis rasé comme un rasoir.",
    date: "01 Décembre 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A15e5b41d8d374cc08bd1207a296e27c6i.png_400x400.png_.avif"
    ],
    productName: "Rasoir Électrique Tête Rotative 🚀"
  },
  {
    id: 58,
    name: "Alioune P.",
    location: "Kolda",
    rating: 5,
    comment: "Excellent ! Franchement, j'ai été surpris par son tranchant. J'en ai déjà commandé un deuxième ; le premier pour moi, le second pour mon père. Je suis pleinement satisfait de son fonctionnement",
    date: "15 Novembre 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A498ebb9d48744cd390b4d85309470689v.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Rasoir Électrique Tête Rotative 🚀"
  },
  {
    id: 59,
    name: "Souleymane M.",
    location: "Dakar",
    rating: 5,
    comment: "Parfait pour les retouches rapides. Plus besoin de sortir tout le matériel.",
    date: "01 Novembre 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Aa78f7b6e67514e90b8e9d5937560de35T.jpg_400x400q50.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A0ee80a6d10e94634a350de4d2670cbc81.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Rasoir Électrique Tête Rotative 🚀"
  },
  {
    id: 60,
    name: "Samba R.",
    location: "Thiès",
    rating: 5,
    comment: "J'avais besoin d'un rasoir électrique, et celui-ci semble offrir un excellent rapport qualité-prix. C'est un rasoir très confortable, qui nettoie bien et est facile à utiliser.",
    date: "15 Octobre 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Af9675f2a43e449dea31a431c2b0fcb0b8.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Rasoir Électrique Tête Rotative 🚀"
  },
  {
    id: 61,
    name: "Lamine J.",
    location: "Tambacounda",
    rating: 5,
    comment: "Je suis très satisfaite du rasoir ; il fonctionne parfaitement, se recharge rapidement et est extrêmement efficace. J’ai vraiment tout aimé.",
    date: "01 Octobre 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Ad23c56ed52394192af4804ba90c29005q.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Rasoir Électrique Tête Rotative 🚀"
  },
  {
    id: 62,
    name: "Birame Y.",
    location: "Fatik",
    rating: 5,
    comment: "Compact mais puissant. Idéal pour garder une barbe propre à tout moment.",
    date: "15 Septembre 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Ac975a845fe8c4db697ade3fc7d68b51bM.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Rasoir Électrique Tête Rotative 🚀"
  },
  {
    id: 63,
    name: "Pathé L.",
    location: "Dakar",
    rating: 5,
    comment: "C'est un bon rapport qualité-prix et il me va parfaitement ! Malgré son prix abordable, il est vraiment intéressant.",
    date: "01 Septembre 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Aff02b4ef3a07421f9eaab3ff9612ec9ee.jpg_400x400q50.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A26ab045e3ed94b59af9b1a4b836f4734G.jpg_400x400q50.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A0364d3750f7042c6916aa4a66be387853.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Rasoir Électrique Tête Rotative 🚀"
  },
  {
    id: 64,
    name: "Djiby E.",
    location: "Saint-Louis",
    rating: 5,
    comment: "Le produit est arrivé en parfait état et très rapidement. Il a dépassé mes attentes. Excellent rasoir, fabrication de haute qualité et rasage impeccable.",
    date: "15 Août 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A2d767a3381004ceba2ced52e7e0a8de29.jpg_400x400q50.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Aa9c278e0267540d3b242565b001ff9b7C.jpg_400x400q50.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Ad534ab8727c34beaa01304cdeb163fc6J.jpg_400x400q50.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A418c08a2424841ac95e0658528cd0710D.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Rasoir Électrique Tête Rotative 🚀"
  },
  {
    id: 65,
    name: "Talla W.",
    location: "Dakar",
    rating: 5,
    comment: "Produit de haute qualité. Merci au fabricant, merci au vendeur",
    date: "01 Août 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A8dd97f29f6ea4f1ea66adb49e96e3cbdc.jpg_400x400q50.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A8eaf3d3b7403475992c89af3301a6d2e8.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Rasoir Électrique Tête Rotative 🚀"
  },
  {
    id: 66,
    name: "Gora N.",
    location: "Louga",
    rating: 5,
    comment: "Charge rapide, utilisation facile… exactement ce qu’il me fallait.",
    date: "15 Juillet 2025",
    images: [
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A13357be99cc74286913b3eab061aa0eeQ.jpg_400x400q50.jpg_.avif",
      "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A5cafc2b4b0c54920a1be2e5da792aa40P.jpg_400x400q50.jpg_.avif"
    ],
    productName: "Rasoir Électrique Tête Rotative 🚀"
  },
  {
    id: 67,
    name: "Rama S.",
    location: "Dakar",
    rating: 5,
    comment: "Je l’ai appliqué un soir où ma peau était vraiment fatiguée… Le matin, en me regardant dans le miroir, j’ai eu ce petit moment “wow”. Peau plus fraîche, plus douce… ça change tout.",
    date: "05 Août 2025",
    images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Afb8b763150f0407ea349df5f8282a116A.jpg_960x960q75.jpg_.avif"],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 68,
    name: "Fatou B.",
    location: "Thiès",
    rating: 5,
    comment: "Après une longue journée, je l’ai mis sans trop y croire. Au réveil, ma peau était comme reposée… comme si j’avais dormi 10h 😴✨",
    date: "19 Août 2025",
    images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A02f2b259bc094cac8f6b0f65ea5a9407L.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Ac0f25054589a453fbd46fd31a620f8a9J.jpg_960x960q75.jpg_.avif"],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 69,
    name: "Awa D.",
    location: "Saint-Louis",
    rating: 5,
    comment: "Ce que j’aime, c’est cette sensation au réveil… peau souple, douce, comme revitalisée.",
    date: "02 Septembre 2025",
    images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A531812e5e38c49fba44f5e2bda64f505D.jpg_960x960q75.jpg_.avif"],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 70,
    name: "Mariama K.",
    location: "Mbour",
    rating: 5,
    comment: "Merci, je suis contente de la crème.",
    date: "16 Septembre 2025",
    images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Aa7e84e60a8184285a9e39d8f5b570fe3s.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A21e665f11e674e818b22b7f917180e6eO.jpg_960x960q75.jpg_.avif"],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 71,
    name: "Bineta G.",
    location: "Kaolack",
    rating: 5,
    comment: "Première utilisation un dimanche soir… lundi matin, peau nette et fraîche. Ça commence bien la semaine 😄",
    date: "30 Septembre 2025",
    images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Ae1185fee11364533a37eabb44db8d327P.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Ac8e6f50aef054efbbb14390ef0fa1a79D.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Ada99d784c35b455c852a1fda94b5717cI.jpg_960x960q75.jpg_.avif"],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 72,
    name: "Nafissatou S.",
    location: "Touba",
    rating: 5,
    comment: "Ce n’est pas juste un masque… c’est vraiment un moment pour soi, et ça se voit sur la peau.",
    date: "14 Octobre 2025",
    images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A7e049ab042e24a4ab700fd06ebdf1f5aU.jpg_960x960q75.jpg_.avif"],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 73,
    name: "Seynabou M.",
    location: "Richard-Toll",
    rating: 5,
    comment: "Je l’ai testé par curiosité… Au réveil, peau plus douce. Pas magique, mais clairement agréable.",
    date: "28 Octobre 2025",
    images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A51849327f6c24137a51ae1ff07ed7320C.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A31966307a95b4c7e9e928fe9d42adb1el.jpg_960x960q75.jpg_.avif"],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 74,
    name: "Coumba F.",
    location: "Mbour",
    rating: 5,
    comment: "Je l’utilise 2 à 3 fois par semaine… c’est devenu un bon réflexe pour garder une peau propre.",
    date: "11 Novembre 2025",
    images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Aba9f80e265e4479abe80e447fb2066319.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A2f4a8f6423b8404d8b45062097154fd4T.jpg_960x960q75.jpg_.avif"],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 75,
    name: "Gnagna D.",
    location: "Dakar",
    rating: 4,
    comment: "Je viens de commencer à l'utiliser. Je donnerai plus de détails après quelques jours d'utilisation.",
    date: "25 Novembre 2025",
    images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A23e3e7f4af6c4f238ebf6823cc463656I.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A435406b39dd1405aba1aed914dd0daeeU.jpg_960x960q75.jpg_.avif"],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 76,
    name: "Soda F.",
    location: "Ziguinchor",
    rating: 4,
    comment: "Je ne l'ai pas encore utilisé et j'espère qu'il fonctionnera aussi bien que sur la photo. J'adore l'emballage.",
    date: "09 Décembre 2025",
    images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A2f582911615845c9b1d0329493c71dfa4.jpg_960x960q75.jpg_.avif"],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 77,
    name: "Penda C.",
    location: "Kolda",
    rating: 5,
    comment: "Un bon produit pour compléter une routine, surtout quand la peau est fatiguée.",
    date: "23 Décembre 2025",
    images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A353714e77d804c59a4c828412c37bd49e.jpg_960x960q75.jpg_.avif", "https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Ae5de56fec71748828281cf0d4b424fa2i.jpg_960x960q75.jpg_.avif"],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 78,
    name: "Khady L.",
    location: "Kaolack",
    rating: 5,
    comment: "Très bien. Il suffit d'essayer et de voir.",
    date: "06 Janvier 2026",
    images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A0790d6949d0447d9bec88c7f19c967f8h.jpg_960x960q75.jpg_.avif"],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 79,
    name: "Rama F.",
    location: "Dakar",
    rating: 5,
    comment: "Une peau tellement plus hydratée au réveil, j'adore l'effet fraîcheur.",
    date: "20 Janvier 2026",
    images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A353714e77d804c59a4c828412c37bd49e.jpg_960x960q75.jpg_.avif"],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 80,
    name: "Aminata D.",
    location: "Thiès",
    rating: 5,
    comment: "Très bon produit, je recommande vivement pour les peaux fatiguées.",
    date: "03 Février 2026",
    images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A2f582911615845c9b1d0329493c71dfa4.jpg_960x960q75.jpg_.avif"],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 81,
    name: "Fatou S.",
    location: "Saint-Louis",
    rating: 5,
    comment: "Ma routine de nuit est complète maintenant. Je ne m'en passe plus.",
    date: "17 Février 2026",
    images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Aba9f80e265e4479abe80e447fb2066319.jpg_960x960q75.jpg_.avif"],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 82,
    name: "Moussa B.",
    location: "Kaolack",
    rating: 5,
    comment: "Efficace et agréable sur la peau. Livraison rapide à Kaolack.",
    date: "03 Mars 2026",
    images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A51849327f6c24137a51ae1ff07ed7320C.jpg_960x960q75.jpg_.avif"],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 83,
    name: "Awa K.",
    location: "Touba",
    rating: 4,
    comment: "J'ai vu une différence dès la première semaine sur l'éclat de mon teint.",
    date: "17 Mars 2026",
    images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A7e049ab042e24a4ab700fd06ebdf1f5aU.jpg_960x960q75.jpg_.avif"],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 84,
    name: "Ousmane G.",
    location: "Mbour",
    rating: 5,
    comment: "Parfait pour ma peau sèche, elle est beaucoup plus souple maintenant.",
    date: "31 Mars 2026",
    images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Ae1185fee11364533a37eabb44db8d327P.jpg_960x960q75.jpg_.avif"],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 85,
    name: "Bineta T.",
    location: "Dakar",
    rating: 5,
    comment: "Texture incroyable et résultats visibles rapidement. Merci Vintech !",
    date: "10 Avril 2026",
    images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Aa7e84e60a8184285a9e39d8f5b570fe3s.jpg_960x960q75.jpg_.avif"],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 86,
    name: "Cheikh N.",
    location: "Saint-Louis",
    rating: 5,
    comment: "Très satisfaite de cet achat. Application facile avec le stick.",
    date: "20 Avril 2026",
    images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/A531812e5e38c49fba44f5e2bda64f505D.jpg_960x960q75.jpg_.avif"],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  },
  {
    id: 87,
    name: "Seynabou D.",
    location: "Thiès",
    rating: 5,
    comment: "Le meilleur masque que j'ai testé jusqu'à présent pour l'hydratation de nuit.",
    date: "26 Avril 2026",
    images: ["https://res.cloudinary.com/dpy6oagbm/image/fetch/f_auto,q_auto,w_auto/https://ae-pic-a1.aliexpress-media.com/kf/Ac0f25054589a453fbd46fd31a620f8a9J.jpg_960x960q75.jpg_.avif"],
    productName: "Masque au collagène Lakerin | Crème Exfoliante & Hydratant🌙"
  }
];


const RECENT_PURCHASES = [
  { id: 1, name: "Aminata Diop", product: "Green Mask Stick 🌱", location: "Dakar, Almadies", time: "Il y a 5 min" },
  { id: 3, name: "Bineta Samb", product: "Kit Smartbud 👂🏾", location: "Dakar, Mermoz", time: "Il y a 2 min" },
  { id: 4, name: "Mbayang Mar", product: "Savon au Curcuma 🚿", location: "Thies", time: "Il y a 25 min" },
  { id: 6, name: "Fatou Ba", product: "Green Mask Stick 🌱", location: "Dakar, Almadies", time: "Il y a 5 min" },
  { id: 7, name: "Mouhamed Ndiaye", product: "Rasoir Électrique 🚀", location: "Pikine", time: "Il y a 12 min" },
  { id: 9, name: "Abdou Sall", product: "Savon au Curcuma 🚿", location: "Thies", time: "Il y a 25 min" },
  { id: 10, name: "Gnagna Fall", product: "Savon au Curcuma 🚿", location: "Saint-Louis", time: "Il y a 53 min" }
];

// --- Components ---

const AnnouncementBar = () => {
  return (
    <div className="bg-brand-accent text-brand-bg h-9 overflow-hidden flex items-center font-semibold text-[12.5px] tracking-wide">
      <div className="flex gap-20 whitespace-nowrap animate-ticker pl-full">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-20">
            <span>🎁 Livraison gratuite partout à Dakar et en moins de 2H 🕙</span>
            <span>✅ Paiement à la réception sur toutes les commandes</span>
            <span>📦 Livraison via Dakar Dem Dikk en dehors de Dakar 🚐</span>
            <span>⭐ +15 000 clients satisfaits — Rejoignez la famille Vintech</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Navbar = ({ cartCount, onOpenCart, onOpenNav }: { cartCount: number, onOpenCart: () => void, onOpenNav: () => void }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-brand-bg/95 backdrop-blur-md border-b border-brand-border' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
        <div className="flex items-center w-1/4 md:w-1/3">
          <button onClick={onOpenNav} className="p-2 text-black hover:text-brand-bg hover:bg-brand-accent rounded-full transition-all">
            <Menu size={22} className="md:w-6 md:h-6" />
          </button>
        </div>

        <div className="flex items-center justify-center w-1/2 md:w-1/3">
          <Link to="/" className="hover:scale-105 transition-transform">
            <img 
              src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEghnp-vjbnuQNUn5n8ElxyoWiUQGnYXlXqt9dEPNBOMuM716D1CRdlEMDGlt4iRhIOmRDWajOHolrpay_KLCZDx0izg2ypt-aDBQ3UEycricTkyeOarp2Cd8NwaF6ewQIVsw0NyPUiF18D0LoqE8_JwJesl-cSt6rl2iwZTDbqzG6xu20WxQpFc-oDXGuo/s800/Design_sans_titre-removebg-preview.webp" 
              alt="Vintech Afrik Logo" 
              className="h-10 md:h-16 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </Link>
        </div>

        <div className="flex items-center justify-end gap-1 md:gap-4 w-1/4 md:w-1/3">
          <button className="p-2 text-black hover:text-brand-bg hover:bg-brand-accent rounded-full transition-all">
            <Search size={18} />
          </button>
          <button className="hidden sm:flex p-2 text-black hover:text-brand-bg hover:bg-brand-accent rounded-full transition-all">
            <User size={18} />
          </button>
          <button onClick={onOpenCart} className="p-2 text-black hover:text-brand-bg hover:bg-brand-accent rounded-full transition-all relative">
            <ShoppingBag size={18} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-brand-accent text-brand-bg text-[9px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

const NavDrawer = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const navigate = useNavigate();
  
  const handleNavigate = (path: string, id?: string) => {
    navigate(path);
    if (id) {
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
    onClose();
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
          />
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[300px] max-w-[80vw] bg-brand-surface border-r border-brand-border z-[110] flex flex-col shadow-2xl"
          >
            <div className="p-5 border-b border-brand-border flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Menu</h2>
              <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-brand-text-muted hover:bg-brand-surface-alt hover:text-brand-bg transition-all">
                <X size={20} />
              </button>
            </div>
            
            <nav className="flex-1 p-6">
              <ul className="space-y-6">
                {[
                  { label: 'Accueil', path: '/' },
                  { label: 'Nos produits', path: '/products' },
                  { label: 'Nos collections', path: '/collections' },
                  { label: 'Avis clients', path: '/reviews' },
                  { label: 'Contact', path: '/contact' }
                ].map((item: any) => (
                  <li key={item.label}>
                    <button 
                      onClick={() => handleNavigate(item.path, item.id)}
                      className="text-lg font-semibold uppercase tracking-wider text-black hover:text-brand-accent transition-colors block text-left w-full"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="p-6 border-t border-brand-border">
              <div className="flex gap-6 justify-center">
                <a 
                  href="https://www.tiktok.com/@vintech_afrik?is_from_webapp=1&sender_device=pc" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-brand-text-muted hover:text-brand-accent transition-colors"
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    width="20" 
                    height="20" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    fill="none" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                  </svg>
                </a>
                <a 
                  href="https://www.instagram.com/vintech_afrik/?utm_source=ig_web_button_share_sheet" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-brand-text-muted hover:text-brand-accent transition-colors"
                >
                  <Instagram size={20} />
                </a>
                <a 
                  href="https://www.facebook.com/share/17axqGhxkr/?mibextid=wwXIfr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-brand-text-muted hover:text-brand-accent transition-colors"
                >
                  <Facebook size={20} />
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const RecentPurchaseNotification = () => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  const localizedPurchases = useMemo(() => {
    const config = COUNTRY_CONFIG['SN'];
    return RECENT_PURCHASES.map(purchase => ({
      ...purchase,
      name: config.names[purchase.id % config.names.length],
      location: config.locations[purchase.id % config.locations.length]
    }));
  }, []);

  useEffect(() => {
    let cycleTimer: any;
    
    // Stop the notification cycle after 1 minute and 10 seconds (70,000 ms)
    const stopTimer = setTimeout(() => {
      setVisible(false);
      if (cycleTimer) clearInterval(cycleTimer);
    }, 70000);

    const showTimer = setTimeout(() => setVisible(true), 5000);
    
    cycleTimer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % localizedPurchases.length);
        setVisible(true);
      }, 1000);
    }, 8000);

    return () => {
      clearTimeout(stopTimer);
      clearTimeout(showTimer);
      if (cycleTimer) clearInterval(cycleTimer);
    };
  }, [localizedPurchases]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -50, y: 50 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -50, y: 50 }}
          className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-auto z-[90] bg-brand-surface border border-brand-border p-3 md:p-4 rounded-xl shadow-2xl flex items-center gap-3 md:gap-4 max-w-sm mx-auto md:mx-0"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-accent/10 rounded-full flex items-center justify-center text-brand-accent flex-shrink-0">
            <ShoppingBag size={18} md:size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] md:text-[13px] italic text-black font-bold truncate">
              {localizedPurchases[index].name} : {localizedPurchases[index].location}
            </p>
            <p className="text-[11px] md:text-[12px] text-brand-text-muted truncate">
              Vient d'acheter : <span className="text-brand-accent font-semibold">{localizedPurchases[index].product}</span>
            </p>
            <p className="text-[9px] md:text-[10px] text-brand-text-muted mt-1 italic flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {localizedPurchases[index].time}
            </p>
          </div>
          <button onClick={() => setVisible(false)} className="absolute top-2 right-2 text-brand-text-muted hover:text-brand-bg">
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ReviewsSection = ({ onShowAllReviews, onProductClick, reviews }: { onShowAllReviews: () => void, onProductClick: (productName: string) => void, reviews: any[] }) => {
  // Only keep short reviews (<= 25 words) for the homepage marquee
  const shortReviews = reviews.filter(review => {
    const wordCount = review.comment ? review.comment.trim().split(/\s+/).length : 0;
    return wordCount <= 25;
  });

  // Create two interleaved rows independently to ensure strict A->B->C pattern in both
  const { firstRow, secondRow } = useMemo(() => {
    const groups: Record<string, any[]> = {};
    shortReviews.forEach(review => {
      const key = review.productName || 'Other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(review);
    });

    const keys = Object.keys(groups);
    const r1: any[] = [];
    const r2: any[] = [];

    // Distribute reviews from each product category to two independent pools
    const pools: Record<string, { r1: any[], r2: any[] }> = {};
    keys.forEach(key => {
      pools[key] = { r1: [], r2: [] };
      groups[key].forEach((review, idx) => {
        if (idx % 2 === 0) pools[key].r1.push(review);
        else pools[key].r2.push(review);
      });
    });

    // Interleave for Row 1
    const max1 = Math.max(0, ...keys.map(k => pools[k].r1.length));
    for (let i = 0; i < max1; i++) {
      for (const key of keys) {
        if (pools[key].r1[i]) r1.push(pools[key].r1[i]);
      }
    }

    // Interleave for Row 2
    const max2 = Math.max(0, ...keys.map(k => pools[k].r2.length));
    for (let i = 0; i < max2; i++) {
      for (const key of keys) {
        if (pools[key].r2[i]) r2.push(pools[key].r2[i]);
      }
    }

    return { firstRow: r1, secondRow: r2 };
  }, [shortReviews]);

  return (
    <section id="avis-clients" className="py-2 md:py-3 bg-brand-surface-alt/30 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center mb-1 md:mb-2">
          <div className="inline-flex items-center gap-2 bg-brand-accent/10 text-brand-accent px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2 md:mb-3">
            <CheckCircle size={14} />
            Plus de 15 000 clients satisfaits
          </div>
          <h2 className="font-display text-2xl md:text-5xl font-extrabold mb-2 md:mb-3 tracking-tight">
            Ce que disent nos clients <span className="text-brand-accent">⭐</span>
          </h2>
          
          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 mt-2 md:mt-4">
            {[
              { id: 'all', label: 'Tous les avis', icon: '📝' },
              { id: 'photos', label: 'Avec photos', icon: '📸' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'all') {
                    onShowAllReviews();
                  } else {
                    // Navigate to reviews with photos filter
                    const navigate = (window as any).navigation_hook_navigate;
                    if (navigate) {
                      navigate('/reviews?filter=photos');
                      window.scrollTo(0, 0);
                    } else {
                      onShowAllReviews();
                    }
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-full text-xs md:text-sm font-bold transition-all bg-brand-surface border border-brand-border text-brand-text-muted hover:border-brand-accent hover:bg-white"
              >
                <span>{tab.icon}</span>
                {tab.label}
                </button>
            ))}
          </div>
        </div>

      {/* Marquee Rows */}
      <div className="space-y-2 relative">
        {/* Row 1 */}
        <div className="flex overflow-hidden group">
          <div className="flex items-start gap-6 animate-marquee whitespace-nowrap py-0.5">
            {[...firstRow, ...firstRow].map((review, idx) => (
              <ReviewCard key={`${review.id}-${idx}`} review={review} onProductClick={onProductClick} className="w-[280px] md:w-[350px]" />
            ))}
          </div>
        </div>

        {/* Row 2 */}
        <div className="flex overflow-hidden group">
          <div className="flex items-start gap-6 animate-marquee-reverse whitespace-nowrap py-0.5">
            {[...secondRow, ...secondRow].map((review, idx) => (
              <ReviewCard key={`${review.id}-${idx}`} review={review} onProductClick={onProductClick} className="w-[280px] md:w-[350px]" />
            ))}
          </div>
        </div>

        {/* Gradient Overlays */}
        <div className="absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-brand-surface-alt/30 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-brand-surface-alt/30 to-transparent z-10 pointer-events-none" />
      </div>

      <div className="mt-1 flex flex-col items-center gap-4 px-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onShowAllReviews}
          className="bg-brand-accent text-white px-8 py-3.5 md:px-10 md:py-4 rounded-full font-bold text-xs md:text-sm uppercase tracking-widest hover:bg-brand-accent-dark transition-all shadow-xl"
        >
          VOIR PLUS D'AVIS
        </motion.button>
      </div>
    </section>
  );
};

const ReviewCard = ({ review, onProductClick, className, ...props }: { review: Review, onProductClick?: (productName: string) => void, className?: string } & React.HTMLAttributes<HTMLDivElement>) => (
  <div {...props} className={`flex-shrink-0 bg-brand-surface border border-brand-border p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm hover:shadow-xl hover:border-brand-accent/50 transition-all relative overflow-hidden group flex flex-col whitespace-normal h-fit ${className || ""}`}>
    <div className="absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 bg-brand-accent/5 rounded-full -mr-8 -mt-8 md:-mr-10 md:-mt-10 transition-transform group-hover:scale-150 duration-700" />
    
    <div className="relative z-10 flex flex-col">
      <div className="flex items-center gap-1 mb-2 md:mb-3">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`text-xs md:text-sm ${i < review.rating ? "text-yellow-400" : "text-gray-200"}`}>★</span>
        ))}
      </div>

      {review.images && review.images.length > 0 ? (
        <div className={`mb-3 md:mb-4 rounded-xl overflow-hidden relative ${review.images.length > 1 ? 'grid grid-cols-2 gap-1' : 'aspect-[16/9]'}`}>
          {review.images.slice(0, 4).map((img, idx) => (
            <div key={idx} className={`relative ${review.images!.length === 1 ? 'w-full h-full' : 'aspect-square'}`}>
              <img 
                src={img} 
                alt="Review" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {idx === 3 && review.images!.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold">
                  +{review.images!.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : review.image && (
        <div className="mb-3 md:mb-4 rounded-xl overflow-hidden aspect-[16/9] relative">
          <img 
            src={review.image} 
            alt="Review" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      <div className="mb-2 md:mb-2">
        <p className="text-black text-[13px] md:text-[14px] font-medium leading-relaxed italic">
          "{review.comment}"
          {review.productName && (
            <button 
              onClick={() => onProductClick?.(review.productName!)}
              className="text-[#54b9ff] font-bold hover:underline not-italic ml-1 inline-block"
            >
              {review.productName}
            </button>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2 md:gap-3 pt-2.5 md:pt-3 border-t border-brand-border/30">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent font-bold text-xs md:text-sm border border-brand-accent/20">
          {review.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col mb-0.5">
            <h4 className="font-bold text-[12px] md:text-[13px] truncate">{review.name}, {review.location}</h4>
            <div className="flex items-center gap-1 bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded-full text-[8px] md:text-[9px] font-bold whitespace-nowrap w-fit mt-1">
              <CheckCircle size={8} />
              Achat vérifié
            </div>
          </div>
          <p className="text-[9px] md:text-[10px] text-brand-text-muted font-medium uppercase tracking-wider">{review.date}</p>
        </div>
      </div>
    </div>
  </div>
);

const Hero = ({ onExplore }: { onExplore: () => void }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-[450px] md:h-[580px] overflow-hidden bg-brand-surface">
      <div 
        className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.77,0,0.18,1)]"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {SLIDES.map((slide, idx) => (
          <div key={idx} className="min-w-full relative flex items-center overflow-hidden">
            <div 
              className={`absolute inset-0 bg-contain bg-no-repeat bg-center transition-transform duration-[8s] ease-linear ${current === idx ? 'scale-100' : 'scale-105'}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            />
            {/* Overlay removed to show full image brightness */}
            
            <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full">
              {slide.tag && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={current === idx ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="inline-block bg-brand-accent text-brand-bg text-[10px] md:text-[11px] font-bold tracking-widest uppercase px-3 py-1 md:px-3.5 md:py-1.5 rounded-full mb-3 md:mb-4"
                >
                  {slide.tag}
                </motion.div>
              )}
              
              {slide.title && (
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={current === idx ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ delay: 0.35, duration: 0.5 }}
                  className="font-display text-3xl md:text-6xl font-extrabold leading-[1.1] max-w-xl mb-3 md:mb-4"
                >
                  {slide.title}
                </motion.h1>
              )}
              
              {slide.sub && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={current === idx ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-base md:text-lg text-white/90 max-w-md mb-6 md:mb-8"
                >
                  {slide.sub}
                </motion.p>
              )}
              
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-5 md:bottom-7 right-6 md:right-12 z-20 flex gap-2 md:gap-2.5">
        {SLIDES.map((_, idx) => (
          <button 
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all duration-300 ${current === idx ? 'bg-brand-accent scale-150' : 'bg-black/35'}`}
          />
        ))}
      </div>
    </section>
  );
};

interface ProductCardProps {
  product: Product;
  onAddToCart: (p: Product) => void;
  onBuyNow: (p: Product) => void;
  onShowDetail: (p: Product) => void;
  onShowToast: (m: string) => void;
  formatPrice: (price: number) => string;
}

const ProductCard: React.FC<Omit<ProductCardProps, 'onShowDetail'>> = ({ product, onAddToCart, onBuyNow, onShowToast, formatPrice }) => {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  const shakeAnimation = {
    x: [0, -3, 3, -3, 3, -2, 2, -1, 1, 0],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatDelay: 2,
      ease: "easeInOut"
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        navigate(`/products/${product.slug}`);
        window.scrollTo(0, 0);
      }}
      className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden group cursor-pointer hover:border-brand-accent transition-all hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/10 flex flex-col h-full"
    >
      <div className="aspect-square overflow-hidden bg-brand-surface-alt relative">
        <img 
          src={(hovered && product.images.length > 1 ? product.images[1] : product.image) || undefined} 
          alt={product.name} 
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />

        {product.badge && (
          <div className="absolute top-2 left-2 z-10">
            <motion.span 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-[#c0392b] text-white text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg"
            >
              {product.badge}
            </motion.span>
          </div>
        )}

        {/* Hover Buttons Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-2 md:p-3 flex flex-col gap-1.5 md:gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8 md:pt-12">
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              navigate(`/products/${product.slug}`);
              window.scrollTo(0, 0);
            }}
            className="w-full bg-brand-accent text-white py-2 md:py-2.5 rounded-lg font-bold text-[10px] md:text-xs hover:bg-brand-accent-dark transition-colors shadow-lg flex items-center justify-center gap-1.5"
          >
            <ShoppingBag size={12} md:size={14} />
            Commander maintenant
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
            className="w-full bg-white text-black py-2 md:py-2.5 rounded-lg font-bold text-[10px] md:text-xs hover:bg-gray-100 transition-colors shadow-lg flex items-center justify-center gap-1.5"
          >
            <Plus size={12} md:size={14} />
            Ajouter au panier
          </button>
        </div>
      </div>
      
      <div className="p-3 md:p-4 flex flex-col flex-1">
        <h3 className="text-[13px] md:text-sm font-bold leading-tight mb-2 md:mb-2.5 line-clamp-2 min-h-[2.4rem] md:min-h-[2.8rem] text-black">
          {product.name}
        </h3>
        
        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-base md:text-lg font-bold text-[#c0392b]">
            {formatPrice(product.price)}
          </span>
          <span className="text-[12px] md:text-sm text-slate-400 line-through">
            {formatPrice(product.originalPrice)}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <Star size={10} fill="#f1c40f" className="text-[#f1c40f]" />
            <span className="text-[10px] font-bold text-slate-400">({product.reviewsCount})</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface CheckoutFormProps {
  product?: Product;
  items?: CartItem[];
  onClose?: () => void;
  onShowToast?: (message: string, type: 'success' | 'error') => void;
  formatPrice: (price: number) => string;
}

// --- Meta Pixel Tracking ---
const trackMetaEvent = (eventName: string, params?: any) => {
  const pixelId = (import.meta as any).env.VITE_META_PIXEL_ID || '2047759392706232';
  if (!pixelId) return;
  
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', eventName, params);
  }
};

const CheckoutForm: React.FC<CheckoutFormProps> = ({ product, items, onClose, onShowToast, formatPrice }) => {
  const [delivery, setDelivery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<number | null>(null);
  
  const countryConfig = COUNTRY_CONFIG['SN'];

  const [formData, setFormData] = useState({
    name: '',
    phone: countryConfig.phonePrefix,
    region: '',
    address: ''
  });

  const bundleOptions = useMemo(() => {
    if (!product) return [];
    if (product.bundleOptions) return product.bundleOptions;
    
    return [
      { quantity: 1, price: product.price },
      { 
        quantity: 2, 
        price: Math.round(product.price * 2 * 0.85 / 100) * 100, 
        discountBadge: 'Économise 15% 🎁',
        isPopular: true 
      },
      { 
        quantity: 3, 
        price: Math.round(product.price * 3 * 0.75 / 100) * 100, 
        discountBadge: 'Économise 25% 🎁' 
      }
    ];
  }, [product]);

  useEffect(() => {
    if (formData.region === 'dakar') {
      setDelivery('capital');
    } else if (formData.region) {
      setDelivery('other');
    } else {
      setDelivery('');
    }
  }, [formData.region]);

  const capitalizeWords = (str: string) => {
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const handlePhoneChange = (value: string) => {
    const prefix = countryConfig.phonePrefix;
    const prefixDigits = prefix.replace(/\D/g, '');
    
    // Extract only digits
    const digits = value.replace(/\D/g, '');
    
    // Remove the prefix if it was typed/pasted
    let rawDigits = digits;
    if (digits.startsWith(prefixDigits)) {
      rawDigits = digits.slice(prefixDigits.length);
    }
    
    // Limit to 9 digits
    const limitedDigits = rawDigits.slice(0, 9);
    
    // Format: +XXX XX XXX XX XX
    let formatted = prefix;
    if (limitedDigits.length > 0) {
      formatted += ' ' + limitedDigits.slice(0, 2);
    }
    if (limitedDigits.length > 2) {
      formatted += ' ' + limitedDigits.slice(2, 5);
    }
    if (limitedDigits.length > 5) {
      formatted += ' ' + limitedDigits.slice(5, 7);
    }
    if (limitedDigits.length > 7) {
      formatted += ' ' + limitedDigits.slice(7, 9);
    }
    
    setFormData({ ...formData, phone: formatted });
  };

  const totalItemsPrice = useMemo(() => {
    if (product) {
      if (selectedBundle === null) return 0;
      const bundle = bundleOptions.find(b => b.quantity === selectedBundle);
      return bundle ? bundle.price : product.price * selectedBundle;
    }
    return items ? items.reduce((sum, item) => sum + item.price * item.quantity, 0) : 0;
  }, [product, items, selectedBundle, bundleOptions]);
  
  const deliveryFee = delivery === 'capital' ? countryConfig.deliveryFees.capital : (delivery === 'other' ? countryConfig.deliveryFees.other : 0);
  const total = totalItemsPrice + deliveryFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (product && selectedBundle === null) {
      if (onShowToast) onShowToast('Veuillez sélectionner une offre.', 'error');
      else alert('Veuillez sélectionner une offre.');
      return;
    }
    
    if (!formData.name) {
      if (onShowToast) onShowToast('Veuillez indiquer votre nom complet.', 'error');
      else alert('Veuillez indiquer votre nom complet.');
      return;
    }

    // Phone validation: must be +221 followed by 9 digits starting with 70, 71, 75, 76, 77, 78
    const prefixDigits = countryConfig.phonePrefix.replace(/\D/g, '');
    const phoneDigits = formData.phone.replace(/\D/g, '').replace(new RegExp(`^${prefixDigits}`), '');
    const allowedPrefixes = ['70', '71', '75', '76', '77', '78'];
    const hasValidPrefix = allowedPrefixes.some(p => phoneDigits.startsWith(p));

    if (phoneDigits.length !== 9 || !hasValidPrefix) {
      if (onShowToast) onShowToast('Le numéro de téléphone est invalide. Il doit commencer par 70, 71, 75, 76, 77 ou 78.', 'error');
      else alert('Le numéro de téléphone est invalide. Il doit commencer par 70, 71, 75, 76, 77 ou 78.');
      return;
    }

    if (!formData.region) {
      if (onShowToast) onShowToast('Veuillez indiquer votre région.', 'error');
      else alert('Veuillez indiquer votre région.');
      return;
    }

    if (!formData.address) {
      if (onShowToast) onShowToast('Veuillez indiquer votre adresse complète.', 'error');
      else alert('Veuillez indiquer votre adresse complète.');
      return;
    }
    setIsSubmitting(true);

    const processOrder = async () => {
      try {
        // 1. Get next sequential ID from Firestore
        const counterRef = doc(db, 'metadata', 'orders');
        const counterDoc = await getDoc(counterRef);
        let nextOrderId = 1000;
        
        if (counterDoc.exists()) {
          nextOrderId = (counterDoc.data().lastId || 999) + 1;
        }
        
        // 2. Update counter
        await setDoc(counterRef, { lastId: nextOrderId }, { merge: true });
        localStorage.setItem('last_order_id', nextOrderId.toString());

        // 3. Prepare Order Data
        const orderData = {
          sequentialId: nextOrderId || 1000,
          customerName: formData.name || '',
          phone: formData.phone || '',
          region: formData.region || '',
          address: formData.address || '',
          total: total || 0,
          status: 'pending',
          paymentStatus: 'unpaid',
          items: product 
            ? [{ 
                name: product.name || 'Produit', 
                quantity: selectedBundle || 1, 
                price: totalItemsPrice || 0 
              }] 
            : (items || []).map(item => ({
                name: item.name || 'Produit',
                quantity: item.quantity || 1,
                price: item.price || 0
              })),
          country: 'SN',
          createdAt: serverTimestamp()
        };
        
        // 4. Save Order
        const docRef = await addDoc(collection(db, 'orders'), orderData);
        console.log("Order saved to Firestore with ID:", docRef.id, "Sequential ID:", nextOrderId);

        const now = new Date();
        const dateFormatted = now.toLocaleDateString('fr-FR', { 
          weekday: 'short', 
          day: '2-digit', 
          month: '2-digit' 
        }).replace('.', '');

        const dateStr = now.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
        const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        const capitalizedRegion = formData.region
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join('-');

        // Send to Google Sheet
        const sheetUrl = (import.meta as any).env.VITE_GOOGLE_SHEET_URL || 'https://script.google.com/macros/s/AKfycbw0AW_a4_uJ2AGTwc8nDiKwvqEY9lcKZestvT5tBlgCJYECiJYGgyzmLX4t1gzOBGaUSw/exec';
        if (sheetUrl) {
          fetch(sheetUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
              orderId: nextOrderId,
              name: formData.name,
              phone: formData.phone,
              region: capitalizedRegion,
              address: formData.address,
              date: dateFormatted,
              amount: total,
              orderSummary: product ? `${product.name} (x${selectedBundle})` : items?.map(i => `${i.name} (x${i.quantity})`).join(', ')
            })
          }).catch(err => console.error("Sheet error:", err));
        }

        // --- Construct Order Summary for Notifications ---
        let orderSummary = '';
        if (product) {
          orderSummary = `- ${product.name} : ${formatPrice(totalItemsPrice)} x ${selectedBundle}`;
        } else if (items) {
          orderSummary = items.map(item => `- ${item.name} : ${formatPrice(item.price)} x ${item.quantity}`).join('\n');
        }

        const notificationMessage = `*[Vintech Afrik] Nouvelle Commande #${nextOrderId}*

👤 *Client :* ${formData.name}
📞 *Téléphone :* ${formData.phone}
📍 *Région :* ${capitalizedRegion}
🏠 *Adresse :* ${formData.address}

📦 *Produits :*
${orderSummary}

💰 *Sous-total :* ${formatPrice(totalItemsPrice)}
🚚 *Livraison :* ${formatPrice(deliveryFee)}
🔥 *TOTAL À PAYER :* ${formatPrice(total)}

⏰ *Date :* ${dateStr} à ${timeStr}
💳 *Paiement :* Cash à la livraison`;

        // --- Send Telegram Notification ---
        const telegramToken = (import.meta as any).env.VITE_TELEGRAM_BOT_TOKEN || '8455077089:AAGoPQEKa72a4A-IffgmOui2yzSqbi9iZsE';
        const telegramChatId = (import.meta as any).env.VITE_TELEGRAM_CHAT_ID || '-5183798839';

        if (telegramToken && telegramChatId) {
          const telegramUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
          fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: telegramChatId,
              text: notificationMessage,
              parse_mode: 'Markdown'
            })
          }).catch(err => console.error("Telegram error:", err));
        }

        // Pixel Tracking
        trackMetaEvent('Purchase', {
          value: total,
          currency: 'XOF',
          content_name: product?.name || 'Multiple Products',
          order_id: nextOrderId
        });

        // Success State
        setIsSubmitting(false);
        if (onClose) onClose();
        
        const event = new CustomEvent('order-success', { 
          detail: { 
            message: '🎉 Commande réussie !',
            customerName: formData.name,
            orderId: nextOrderId,
            total: total
          } 
        });
        window.dispatchEvent(event);

      } catch (err) {
        console.error("Order processing error details:", err);
        setIsSubmitting(false);
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la commande. Réessayez.';
        if (onShowToast) onShowToast(errorMessage, 'error');
      }
    };

    processOrder();
  };

  const shakeAnimation = {
    x: [0, -3, 3, -3, 3, -2, 2, -1, 1, 0],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatDelay: 2,
      ease: "easeInOut"
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 w-full max-w-full overflow-hidden box-border px-1 sm:px-0">
        {/* Bundle Selection */}
        {product && bundleOptions.length > 0 && (
          <div className="space-y-2.5 px-1">
            <h3 className="text-[12px] font-bold text-slate-800 text-center uppercase tracking-wider">
              Veuillez remplir ce formulaire pour commander 📝
            </h3>
            <div className="grid gap-1.5">
              {bundleOptions.map((option) => (
                <div key={option.quantity} className="relative group">
                  <button
                    type="button"
                    onClick={() => setSelectedBundle(option.quantity)}
                    className={`w-full p-2 rounded-xl border-2 transition-all flex items-center justify-between gap-2 relative overflow-hidden ${
                      selectedBundle === option.quantity 
                        ? 'border-[#0095ff] bg-[#f0f9ff] ring-4 ring-[#0095ff]/10' 
                        : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedBundle === option.quantity ? 'border-[#0095ff]' : 'border-slate-200'
                      }`}>
                        {selectedBundle === option.quantity && <div className="w-2 h-2 rounded-full bg-[#0095ff]" />}
                      </div>
                      <div className="flex flex-col items-start leading-tight">
                        <span className={`font-black text-sm ${selectedBundle === option.quantity ? 'text-[#0095ff]' : 'text-slate-800'}`}>
                          Achetez {option.quantity} pcs
                        </span>
                        {option.discountBadge && (
                          <span className="bg-[#0095ff] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full mt-0.5">
                            {option.discountBadge}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="font-black text-[15px] text-slate-900 bg-slate-50 px-1.5 py-0.5 rounded-lg">
                        {formatPrice(option.price)}
                      </div>
                      {option.quantity > 1 && (
                        <div className="text-[10px] text-slate-400 line-through mt-0.5">
                          {formatPrice(product.price * option.quantity)}
                        </div>
                      )}
                    </div>
                    {option.isPopular && (
                      <div className="absolute top-0 right-0">
                        <div className="bg-[#0095ff] text-white text-[7px] font-bold px-1.5 py-0.5 rounded-bl-lg uppercase tracking-tighter">
                          Le plus populaire 🔥
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Form Fields */}
      <div className="space-y-4 px-2 sm:px-0">
        <div>
          <label className="block text-[11px] font-bold mb-1.5 ml-2 text-slate-700 uppercase tracking-wider">Prénom et Nom<span className="text-red-500">*</span></label>
          <div className="flex border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 transition-colors bg-white shadow-sm">
            <div className="w-11 bg-slate-50/50 flex items-center justify-center text-slate-400 border-r border-slate-200">
              <User size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Ex : Maman Ndiaye"
              className="flex-1 px-4 py-3 text-base outline-none bg-white font-medium placeholder:text-slate-300"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: capitalizeWords(e.target.value)})}
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold mb-1.5 ml-2 text-slate-700 uppercase tracking-wider">Téléphone<span className="text-red-500">*</span></label>
          <div className="flex border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 transition-colors bg-white shadow-sm">
            <div className="w-11 bg-slate-50/50 flex items-center justify-center text-slate-400 border-r border-slate-200">
              <Phone size={18} />
            </div>
            <input 
              type="tel" 
              placeholder="+221"
              className="flex-1 px-4 py-3 text-base outline-none bg-white font-medium placeholder:text-slate-300"
              value={formData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold mb-1.5 ml-2 text-slate-700 uppercase tracking-wider">Région<span className="text-red-500">*</span></label>
          <div className="relative">
            <select 
              className="w-full pl-4 pr-10 py-3 text-base border border-slate-200 rounded-xl outline-none bg-white appearance-none focus:border-blue-500 transition-colors shadow-sm font-medium"
              value={formData.region}
              onChange={(e) => setFormData({...formData, region: e.target.value})}
            >
              <option value="">Veuillez sélectionnez votre région</option>
              {countryConfig.locations.map(loc => (
                <option key={loc} value={loc.toLowerCase()}>{loc}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold mb-1.5 ml-2 text-slate-700 uppercase tracking-wider">Adresse<span className="text-red-500">*</span></label>
          <div className="flex border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-500 transition-colors bg-white shadow-sm">
            <div className="w-11 bg-slate-50/50 flex items-center justify-center text-slate-400 border-r border-slate-200">
              <MapPin size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Ex : Ouakam"
              className="flex-1 px-4 py-3 text-base outline-none bg-white font-medium placeholder:text-slate-300"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: capitalizeWords(e.target.value)})}
            />
          </div>
        </div>

        {/* Delivery Selection - Read Only (Driven by Region) */}
        <div className="space-y-2">
          <div className="bg-slate-50 rounded-xl p-1 border-2 border-slate-100 opacity-90">
            <div className="space-y-1">
              <div 
                className={`w-full p-2 rounded-lg flex items-center justify-between gap-2 transition-all ${formData.region === 'dakar' ? 'bg-white shadow-sm border-2 border-[#0095ff]' : 'border-2 border-transparent bg-slate-50/50'}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${formData.region === 'dakar' ? 'border-[#0095ff]' : 'border-slate-300'}`}>
                    {formData.region === 'dakar' && <div className="w-1.5 h-1.5 rounded-full bg-[#0095ff]" />}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-[10px] text-slate-900 leading-none">Dakar (Livreur) 🛵</div>
                    <div className="text-[8px] text-slate-400 mt-0.5">Paiement à la livraison</div>
                  </div>
                </div>
                <div className="font-black text-[10px] text-slate-900 shrink-0">Gratuit</div>
              </div>
              
              <div 
                className={`w-full p-2 rounded-lg flex items-center justify-between gap-2 transition-all ${formData.region && formData.region !== 'dakar' ? 'bg-white shadow-sm border-2 border-[#0095ff]' : 'border-2 border-transparent bg-slate-50/50'}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${formData.region && formData.region !== 'dakar' ? 'border-[#0095ff]' : 'border-slate-300'}`}>
                    {(formData.region && formData.region !== 'dakar') && <div className="w-1.5 h-1.5 rounded-full bg-[#0095ff]" />}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-[10px] text-slate-900 leading-none">Hors Dakar (Dakar Dem Dikk) 🚌</div>
                    <div className="text-[8px] text-slate-400 mt-0.5">Après paiement</div>
                  </div>
                </div>
                <div className="font-black text-[10px] text-slate-900 shrink-0">{formatPrice(2000)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 mt-4">
          <motion.button
            type="submit"
            disabled={isSubmitting}
            animate={!isSubmitting && (selectedBundle !== null || !product) ? shakeAnimation : {}}
            className={`w-full text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors ${
              isSubmitting ? 'bg-[#54b9ff] opacity-70 cursor-not-allowed' : 
              (product && selectedBundle === null) ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-[#54b9ff] shadow-blue-200 hover:bg-[#40a9f0]'
            }`}
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShoppingBag size={16} className="shrink-0" />
                <span className="text-[13px] md:text-sm truncate">
                  {product && selectedBundle === null ? 'Sélectionnez une offre' : `Commander • ${formatPrice(total)}`}
                </span>
              </>
            )}
          </motion.button>
      </div>
    </form>
    </>
  );
};

const CartDrawer = ({ 
  isOpen, 
  onClose, 
  items, 
  onRemove,
  onShowToast,
  formatPrice
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  items: CartItem[], 
  onRemove: (id: number) => void,
  onShowToast?: (message: string, type: 'success' | 'error') => void,
  formatPrice: (price: number) => string
}) => {
  const totalItemsPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-[380px] max-w-[90vw] bg-brand-surface border-l border-brand-border z-[110] flex flex-col shadow-2xl"
          >
            <div className="p-4 border-b border-brand-border flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">🛒 Votre panier</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-brand-text-muted hover:bg-brand-surface-alt hover:text-brand-bg transition-all">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
              <div className="space-y-5">
                {items.length === 0 ? (
                  <div className="text-center text-brand-text-muted py-12 text-sm">
                    Votre panier est vide
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="flex gap-3.5 border border-brand-border rounded-xl p-3.5 bg-brand-surface-alt/10">
                      <div className="w-16 h-16 rounded-md bg-brand-surface-alt flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag size={24} className="text-brand-text-muted" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold mb-1 line-clamp-1">{item.name}</div>
                        <div className="text-[13px] text-brand-accent font-bold">
                          {item.quantity} × {formatPrice(item.price)}
                        </div>
                        <button 
                          onClick={() => onRemove(item.id)}
                          className="text-[11px] text-brand-text-muted mt-1.5 hover:text-[#c0392b] transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {items.length > 0 && (
                <div className="pt-6 border-t border-brand-border">
                  <h3 className="font-display text-base font-bold mb-4">Informations de livraison</h3>
                  <CheckoutForm 
                    items={items} 
                    onClose={onClose} 
                    onShowToast={onShowToast} 
                    formatPrice={formatPrice}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const OrderSuccessModal = ({ 
  isOpen, 
  onClose, 
  customerName,
  orderId
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  customerName: string,
  orderId?: string
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 z-[200] backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[min(90vw,400px)] bg-white rounded-2xl shadow-2xl text-slate-900 p-6 md:p-8 text-center my-auto mx-auto"
          >
            <div className="w-14 h-14 md:w-16 md:h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} strokeWidth={2.5} className="md:w-9 md:h-9" />
            </div>
            
            <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 px-2">
              Merci beaucoup pour votre commande, {customerName} ! 🛍️
            </h2>
            
            <div className="space-y-3 text-[13px] md:text-sm text-slate-600 leading-relaxed px-2">
              <p>
                Vous recevrez bientôt une confirmation d’expédition avec les détails de suivi.
              </p>
              <p>
                En attendant, n’hésitez pas à nous contacter si vous avez la moindre question.
              </p>
              <p className="font-bold text-slate-900 mt-4">
                À très bientôt et encore merci pour votre achat ! 👋🏽
              </p>
            </div>
            
            <button 
              onClick={onClose}
              className="mt-6 md:mt-8 w-full bg-brand-accent text-white font-bold py-3.5 md:py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all active:scale-[0.98]"
            >
              Retour à l'accueil
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Toast = ({ message, isVisible, type = 'success' }: { message: string, isVisible: boolean, type?: 'success' | 'error' }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, x: '-50%', y: '-50%' }}
        animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
        exit={{ opacity: 0, scale: 0.8, x: '-50%', y: '-50%' }}
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-2 ${type === 'success' ? 'border-brand-accent text-brand-accent shadow-[0_10px_30px_-5px_rgba(39,172,255,0.3)]' : 'border-red-500 text-red-500 shadow-[0_10px_30px_-5px_rgba(239,68,68,0.3)]'} text-xs md:text-base font-bold px-5 py-3.5 rounded-2xl z-[250] flex items-center gap-3 w-[85vw] max-w-sm text-center justify-center whitespace-normal break-words`}
      >
        <div className="flex items-center gap-3 shrink-0">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 15,
              delay: 0.1 
            }}
          >
            {type === 'success' ? <CheckCircle size={22} strokeWidth={3} /> : <AlertCircle size={22} strokeWidth={3} />}
          </motion.div>
        </div>
        <span className="leading-tight px-1">{message.replace(/^[^\w\s]+/, '').trim()}</span>
      </motion.div>
    )}
  </AnimatePresence>
);

// --- Main App ---

const FeaturesTabs = () => {
  const [activeTab, setActiveTab] = useState(0);
  const features = [
    { icon: <Truck size={24} />, title: "Livraison gratuite", desc: "On s'occupe des frais ! Profitez de la livraison 100% gratuite sur toutes vos commandes à Dakar." },
    { icon: <Smile size={24} />, title: "Satisfaction garantie", desc: "Rejoignez +15 000 acheteurs. Nous nous engageons à offrir une expérience irréprochable ⭐" },
    { icon: <CheckCircle size={24} />, title: "Paiement à la réception", desc: "Nous vous offrons la tranquillité : réglez votre achat une fois le colis livré en main propre 🔏" },
    { icon: <Smartphone size={24} />, title: "Service client 24/7", desc: "Une question ? Notre équipe est toujours disponible pour vous accompagner." }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <section className="bg-brand-surface border-y border-brand-border py-8 md:py-12 px-4 md:px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Tab Buttons */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-6 md:mb-8">
          {features.map((item, idx) => (
            <motion.button
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-2 md:gap-3 px-3.5 py-2.5 md:px-5 md:py-4 rounded-xl md:rounded-2xl transition-all border-2 ${
                activeTab === idx 
                  ? "bg-brand-accent/5 border-brand-accent text-brand-accent shadow-xl shadow-brand-accent/10 scale-105" 
                  : "bg-brand-surface border-brand-border text-brand-text-muted hover:border-brand-accent/30"
              }`}
            >
              <div className={`transition-colors duration-300 ${activeTab === idx ? "text-brand-accent" : "text-black"}`}>
                {React.cloneElement(item.icon as React.ReactElement, { size: 18, className: "md:w-6 md:h-6" })}
              </div>
              <span className="text-[10px] md:text-sm font-bold whitespace-nowrap">{item.title}</span>
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="relative min-h-[240px] md:min-h-[280px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="text-center max-w-2xl px-4"
            >
              <motion.div 
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-brand-accent/10 border-2 border-brand-accent/20 flex items-center justify-center text-brand-accent mx-auto mb-6 md:mb-8 shadow-inner"
              >
                {React.cloneElement(features[activeTab].icon as React.ReactElement, { size: 32, className: "md:w-10 md:h-10" })}
              </motion.div>
              <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl md:text-4xl font-display font-extrabold mb-4 md:mb-6 tracking-tight"
              >
                {features[activeTab].title}
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-base md:text-xl text-brand-text-muted leading-relaxed font-medium"
              >
                {features[activeTab].desc}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <div className="mt-12 flex justify-center gap-2">
          {features.map((_, idx) => (
            <div 
              key={idx}
              className="h-1.5 rounded-full bg-brand-border overflow-hidden w-12"
            >
              {activeTab === idx && (
                <motion.div 
                  layoutId="progress"
                  className="h-full bg-brand-accent"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, ease: "linear" }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CODModal = ({ 
  isOpen, 
  onClose, 
  product,
  onShowToast,
  formatPrice
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  product: Product | null,
  onShowToast?: (message: string, type: 'success' | 'error') => void,
  formatPrice: (price: number) => string
}) => {
  const [delivery, setDelivery] = useState('dakar');
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const navigateImage = useCallback((newDirection: number) => {
    if (!product || !product.images || product.images.length <= 1) return;
    setDirection(newDirection);
    setActiveImageIdx((prev) => {
      const len = product.images.length;
      if (newDirection > 0) return (prev + 1) % len;
      return (prev - 1 + len) % len;
    });
  }, [product?.images?.length]);

  useEffect(() => {
    if (!isOpen || !isAutoPlaying || !product || !product.images || product.images.length <= 1) return;

    const timer = setTimeout(() => {
      navigateImage(1);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isOpen, isAutoPlaying, activeImageIdx, product?.images?.length, navigateImage]);

  useEffect(() => {
    if (isOpen) {
      setActiveImageIdx(0);
      setDirection(0);
      setIsAutoPlaying(true);
    }
  }, [isOpen]);

  if (!product) return null;

  const variants = {
    enter: (d: number) => ({
      x: d > 0 ? '100%' : d < 0 ? '-100%' : 0,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (d: number) => ({
      zIndex: 0,
      x: d > 0 ? '-100%' : d < 0 ? '100%' : 0,
      opacity: 0
    })
  };

  const price1 = product.price;
  const deliveryFee = delivery === 'dakar' ? 0 : 2000;
  const total = price1 + deliveryFee;

  const pulseAnimation = {
    scale: [1, 1.02, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 z-[150] backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-[95%] max-w-[400px] bg-white rounded-xl shadow-2xl text-slate-900 my-auto overflow-hidden max-h-none"
          >
            <div className="p-4 sm:p-5 max-h-[90vh] overflow-y-auto custom-scrollbar overscroll-contain">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ShoppingBag className="text-blue-500" size={20} />
                  Finaliser votre commande
                </h2>
                <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Image Gallery - Film Strip Style */}
              <div className="mb-5">
                <div 
                  className="aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 mb-2 relative group touch-none cursor-pointer"
                  onClick={() => setIsAutoPlaying(false)}
                >
                  <motion.div 
                    className="flex h-full"
                    animate={{ x: `-${activeImageIdx * 100}%` }}
                    transition={{ type: "spring", stiffness: 260, damping: 28 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.4}
                    onDragEnd={(_, info) => {
                      const swipeThreshold = 50;
                      if (info.offset.x < -swipeThreshold) {
                        navigateImage(1);
                        setIsAutoPlaying(false);
                      } else if (info.offset.x > swipeThreshold) {
                        navigateImage(-1);
                        setIsAutoPlaying(false);
                      }
                    }}
                  >
                    {product.images.map((img, idx) => (
                      <div key={idx} className="w-full h-full relative flex-shrink-0">
                        <img 
                          src={img} 
                          alt={`${product.name} ${idx + 1}`}
                          className="w-full h-full object-contain p-2 select-none pointer-events-none"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </motion.div>
                  
                  {/* Progress indicators/dots for images */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
                    {product.images.map((_, dotIdx) => (
                      <div 
                        key={dotIdx}
                        className={`h-1.5 rounded-full transition-all duration-300 ${activeImageIdx === dotIdx ? 'w-5 bg-blue-500 shadow-sm' : 'w-1.5 bg-white/60'}`}
                      />
                    ))}
                  </div>

                  {/* Boutons de navigation manuelle */}
                  <div className="absolute inset-y-0 left-0 flex items-center px-2 z-20 pointer-events-none">
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigateImage(-1); setIsAutoPlaying(false); }}
                      className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto hover:bg-black/40"
                    >
                      <ChevronLeft size={20} />
                    </button>
                  </div>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 z-20 pointer-events-none">
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigateImage(1); setIsAutoPlaying(false); }}
                      className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto hover:bg-black/40"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>

                  {!isAutoPlaying && (
                    <div className="absolute top-2 right-2 z-20 bg-black/40 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full pointer-events-none shadow-sm font-medium">
                      Mode manuel
                    </div>
                  )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {product.images.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => { setActiveImageIdx(idx); setIsAutoPlaying(false); }}
                      className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${activeImageIdx === idx ? 'border-blue-500 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      {img ? (
                        <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full bg-slate-100" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <CheckoutForm product={product} onClose={onClose} onShowToast={onShowToast} formatPrice={formatPrice} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ProductsPage = ({ 
  onBack, 
  onAddToCart, 
  onBuyNow, 
  onShowDetail, 
  onShowToast,
  onProductClick,
  formatPrice
}: { 
  onBack: () => void, 
  onAddToCart: (p: Product) => void,
  onBuyNow: (p: Product) => void,
  onShowDetail: (p: Product) => void,
  onShowToast: (m: string) => void,
  onProductClick: (name: string) => void,
  formatPrice: (price: number) => string
}) => {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('filter');
  const [filter, setFilter] = useState<'all' | 'visage' | 'corps' | 'hygiène'>((categoryFilter as any) || 'all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    if (filter === 'all') return PRODUCTS;
    return PRODUCTS.filter(p => p.category?.toLowerCase() === filter);
  }, [filter]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-brand-surface min-h-screen pb-16"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 md:pt-12">
        <div className="flex items-center justify-between mb-12 md:mb-16">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-brand-surface-alt flex items-center justify-center text-brand-text-muted hover:bg-brand-accent hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 text-center">
            <h1 className="font-display text-3xl md:text-5xl font-black tracking-tight text-black mb-2">Nos Produits</h1>
            <p className="text-brand-text-muted text-sm md:text-base font-bold mb-6">{filteredProducts.length} produits</p>
            
            <div className="sticky top-20 z-30 flex justify-center mb-8 py-2 bg-brand-surface/80 backdrop-blur-md">
              <button 
                onClick={() => setIsFilterOpen(true)}
                className="bg-black text-white px-8 py-3.5 rounded-xl flex items-center justify-center gap-3 shadow-xl hover:bg-brand-accent transition-all group"
              >
                <Filter size={18} className="group-hover:rotate-12 transition-transform" />
                <span className="font-bold text-sm md:text-base tracking-wide uppercase">Filtrer et trier</span>
              </button>
            </div>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={onAddToCart} 
              onBuyNow={onBuyNow}
              onShowDetail={onShowDetail}
              onShowToast={onShowToast}
              formatPrice={formatPrice}
            />
          ))}
        </div>
      </div>

      {/* Filter Modal */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-brand-surface rounded-t-[40px] z-[110] p-8 pb-12 shadow-2xl"
            >
              <div className="max-w-md mx-auto">
                <div className="w-12 h-1.5 bg-brand-border rounded-full mx-auto mb-8" />
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black uppercase tracking-tight">Catégories</h3>
                  <button onClick={() => setIsFilterOpen(false)} className="w-10 h-10 rounded-full bg-brand-surface-alt flex items-center justify-center">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'all', label: 'Tous' },
                    { id: 'visage', label: 'Visage' },
                    { id: 'corps', label: 'Corps' },
                    { id: 'hygiène', label: 'Hygiène' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setFilter(cat.id as any);
                        setIsFilterOpen(false);
                      }}
                      className={`p-5 rounded-2xl border-2 font-bold text-sm transition-all text-center ${
                        filter === cat.id 
                          ? 'border-brand-accent bg-brand-accent/5 text-brand-accent' 
                          : 'border-brand-border bg-white text-slate-600 hover:border-brand-accent/30'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ReviewModal = ({ isOpen, onClose, onAddReview, products }: { 
  isOpen: boolean, 
  onClose: () => void, 
  onAddReview: (review: any) => void,
  products: Product[]
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    rating: 5,
    comment: '',
    productName: products[0]?.name || ''
  });
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6)); // Compress to 60% quality
      };
    });
  };

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setError(null);
      const remainingSlots = 4 - images.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      
      if (files.length > remainingSlots) {
        setError("Limite de 4 photos atteinte.");
      }

      for (const file of filesToProcess) {
        const currentFile = file as File;
        const reader = new FileReader();
        reader.onloadend = async () => {
          if (typeof reader.result === 'string') {
            const compressed = await compressImage(reader.result);
            setImages(prev => {
              if (prev.length >= 4) return prev;
              return [...prev, compressed];
            });
          }
        };
        reader.readAsDataURL(currentFile);
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (images.length === 0) {
      setError("Veuillez ajouter une ou plusieurs photo s'il vous plait");
      return;
    }

    setIsSubmitting(true);
    
    const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    const fullName = `${capitalize(formData.firstName.trim())} ${capitalize(formData.lastName.trim())}`;
    
    const selectedProduct = products.find(p => p.name === formData.productName);
    
    const newReview = {
      id: Date.now(),
      name: fullName,
      location: formData.address.trim() || "Sénégal",
      rating: formData.rating,
      comment: formData.comment,
      date: "À l'instant",
      productName: formData.productName,
      productId: selectedProduct?.id || null,
      image: images[0] || null, // Primary image
      images: images // All images
    };

    const estimatedSize = JSON.stringify(newReview).length;
    if (estimatedSize > 950000) {
      setError("Les photos sont trop volumineuses. Essayez d'en supprimer ou d'utiliser des photos plus petites.");
      setIsSubmitting(false);
      return;
    }

    setTimeout(() => {
      onAddReview(newReview);
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setFormData({
          firstName: '',
          lastName: '',
          address: '',
          rating: 5,
          comment: '',
          productName: products[0]?.name || ''
        });
        setImages([]);
      }, 2000);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative w-full max-w-[480px] bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col h-[82dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden"
      >
        {/* Mobile Handle */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />
        
        {isSuccess ? (
          <div className="p-8 text-center flex-1 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Merci pour votre avis !</h2>
            <p className="text-slate-500 mb-8">Votre témoignage a été publié avec succès.</p>
            <button 
              onClick={onClose}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all"
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            {/* Fixed Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 z-10">
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-slate-900 leading-tight">Rédiger un avis</h2>
                <p className="text-[10px] text-slate-400 font-medium">Remplissez le formulaire ci-dessous</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 -mr-2 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-400"
              >
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 touch-pan-y scroll-smooth overscroll-contain">
              <form id="review-form" onSubmit={handleSubmit} className="space-y-5 pb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Prénom</label>
                    <input 
                      required
                      type="text"
                      value={formData.firstName}
                      onChange={e => setFormData({...formData, firstName: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all"
                      placeholder="Ex: Fatou"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Nom</label>
                    <input 
                      required
                      type="text"
                      value={formData.lastName}
                      onChange={e => setFormData({...formData, lastName: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all"
                      placeholder="Ex: Diop"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Adresse</label>
                  <input 
                    required
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all"
                    placeholder="Ex: Dakar, Plateau"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Produit concerné</label>
                  <div className="relative">
                    <select 
                      required
                      value={formData.productName}
                      onChange={e => setFormData({...formData, productName: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all appearance-none pr-10"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>

                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block text-center">Notez votre expérience</label>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({...formData, rating: star})}
                        className="transition-transform active:scale-125"
                      >
                        <Star 
                          size={32} 
                          className={star <= formData.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Votre avis</label>
                  <textarea 
                    required
                    value={formData.comment}
                    onChange={e => setFormData({...formData, comment: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all h-28 resize-none"
                    placeholder="Dites-nous ce que vous en pensez..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Ajouter des photos (max 4)</label>
                  {error && (
                    <div className="bg-red-50 text-red-600 text-[10px] p-3 rounded-lg border border-red-100 mb-2 font-medium">
                      {error}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group shadow-sm">
                        <img src={img} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-md"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    {images.length < 4 && (
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-brand-accent hover:text-brand-accent transition-all bg-slate-50"
                      >
                        <ImageIcon size={20} />
                        <span className="text-[8px] font-bold mt-1">Photo</span>
                      </button>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleCapture}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                </div>
              </form>
            </div>

            {/* Fixed Footer */}
            <div className="px-6 py-4 pb-4 sm:pb-6 border-t border-slate-100 bg-white shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
              <button 
                form="review-form"
                disabled={isSubmitting}
                type="submit"
                className="w-full bg-brand-accent text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-accent/20 hover:bg-brand-accent-dark transition-all disabled:opacity-50 text-base active:scale-[0.98]"
              >
                {isSubmitting ? 'Publication en cours...' : 'Envoyer mon avis'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

const CollectionsPage = ({ onBack, onCategoryClick }: { onBack: () => void, onCategoryClick: (category: string) => void }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-brand-surface pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-brand-text-muted hover:text-brand-accent mb-8 font-bold transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-white border border-brand-border flex items-center justify-center group-hover:border-brand-accent group-hover:bg-brand-accent group-hover:text-white transition-all">
            <ArrowLeft size={18} />
          </div>
          Retour à l'accueil
        </button>
        
        <div className="mb-12">
          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            Nos Collections <span className="text-brand-accent">✨</span>
          </h1>
          <p className="text-brand-text-muted text-lg max-w-2xl font-bold italic">
            Explorez nos univers et trouvez les produits qui vous correspondent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CATEGORIES.map((cat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => onCategoryClick(cat.label.toLowerCase())}
              className="group relative h-[400px] rounded-3xl overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl transition-all"
            >
              <img 
                src={cat.image} 
                alt={cat.label} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                <h3 className="text-white text-3xl font-black uppercase tracking-widest mb-2 transform transition-transform group-hover:translate-x-2">
                  {cat.label}
                </h3>
                <div className="flex items-center gap-2 text-brand-accent font-bold uppercase text-xs tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                  Découvrir la collection
                  <ArrowRight size={14} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ReviewsPage = ({ onBack, onProductClick, onWriteReview, reviews }: { 
  onBack: () => void, 
  onProductClick: (productName: string) => void,
  onWriteReview: () => void,
  reviews: any[]
}) => {
  const filteredReviews = useMemo(() => {
    const result = [...reviews];

    result.sort((a, b) => {
      const isAStatic = a.id < 10000;
      const isBStatic = b.id < 10000;
      
      if (!isAStatic && isBStatic) return -1;
      if (isAStatic && !isBStatic) return 1;
      if (isAStatic && isBStatic) return a.id - b.id;
      return b.id - a.id;
    });

    return result;
  }, [reviews]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-brand-surface pt-32 pb-20 font-sans">
      <div className="max-w-[1440px] mx-auto px-6">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-brand-text-muted hover:text-brand-accent mb-6 font-bold transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-brand-border flex items-center justify-center group-hover:border-brand-accent group-hover:bg-brand-accent group-hover:text-white transition-all">
            <ArrowLeft size={16} />
          </div>
          <span className="text-sm">Retour</span>
        </button>
        
        <div className="flex flex-col items-center text-center gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-brand-accent/10 text-brand-accent px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
              <CheckCircle size={12} />
              Témoignages clients
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight">
              Tous nos avis <span className="text-brand-accent">⭐</span>
            </h1>
            <button 
              onClick={onWriteReview}
              className="text-brand-accent hover:opacity-80 text-[11px] font-bold mt-4 transition-colors flex items-center gap-1.5 mx-auto uppercase tracking-widest"
            >
              <Pencil size={12} />
              Rédiger un avis
            </button>
          </div>
        </div>
        
        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredReviews.map((review) => (
              <motion.div
                key={review.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <ReviewCard review={review} onProductClick={onProductClick} className="w-full h-full" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (p: Product) => void;
  onBuyNow: (p: Product) => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
  onProductClick?: (productName: string) => void;
  formatPrice: (price: number) => string;
  firestoreReviews: any[];
}

const FormattedDescription = ({ text }: { text: string }) => {
  const lines = text.split('\n');
  
  return (
    <div className="space-y-3 px-2">
      {lines.map((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return null;

        // Hook (first line)
        if (index === 0) {
          return (
            <p key={index} className="text-lg font-bold text-black text-center mb-4">
              {trimmedLine}
            </p>
          );
        }

        // Titles (ending with ? or :)
        if (trimmedLine.endsWith('?') || (trimmedLine.endsWith(':') && !trimmedLine.includes(' : '))) {
          return (
            <div key={index} className="pt-4 pb-2 text-center">
              <p className="text-base font-bold text-black uppercase tracking-widest underline decoration-brand-accent decoration-2 underline-offset-4">
                {trimmedLine}
              </p>
            </div>
          );
        }

        // List items with bold prefix
        if (trimmedLine.includes(' : ')) {
          const [prefix, rest] = trimmedLine.split(' : ');
          return (
            <p key={index} className="text-brand-text-muted leading-relaxed text-sm md:text-base text-justify">
              <span className="font-bold text-black">{prefix}</span> : {rest}
            </p>
          );
        }

        // Regular lines
        return (
          <p key={index} className="text-brand-text-muted leading-relaxed text-sm md:text-base text-justify">
            {trimmedLine}
          </p>
        );
      })}
    </div>
  );
};

const ProductDetail: React.FC<ProductDetailProps> = ({ 
  product, 
  onClose, 
  onAddToCart, 
  onBuyNow,
  onShowToast,
  onProductClick,
  formatPrice,
  firestoreReviews
}) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    if (!product?.images?.length || product.images.length <= 1 || !isAutoPlaying) return;

    const timer = setTimeout(() => {
      setCurrentImage((prev) => (prev + 1) % product.images.length);
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentImage, isAutoPlaying, product?.images?.length]);

  const reviews = useMemo(() => {
    // Collect matching reviews from the deduplicated list passed from parent
    return firestoreReviews.filter(r => 
      r.productName === product.name || r.productId === product.id
    );
  }, [product.name, product.id, firestoreReviews]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-brand-surface min-h-screen relative"
    >
      <div className="max-w-4xl mx-auto bg-white min-h-screen">
        {/* Product Image Section - Film Strip Style */}
        <div className="relative group overflow-hidden">
          <div className="aspect-square relative bg-white overflow-hidden">
            <motion.div
              className="flex h-full"
              animate={{ x: `-${currentImage * 100}%` }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.4}
              onDragStart={() => setIsAutoPlaying(false)}
              onDragEnd={(_, info) => {
                const swipeThreshold = 50;
                const imagesCount = product.images?.length || 1;
                if (info.offset.x < -swipeThreshold) {
                  setCurrentImage((prev) => (prev + 1) % imagesCount);
                } else if (info.offset.x > swipeThreshold) {
                  setCurrentImage((prev) => (prev - 1 + imagesCount) % imagesCount);
                }
              }}
            >
              {product.images.map((img, idx) => (
                <div key={idx} className="w-full h-full relative flex-shrink-0">
                  <img 
                    src={img} 
                    alt={`${product.name} ${idx + 1}`} 
                    className="w-full h-full object-contain p-2 select-none pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </motion.div>
          </div>
          
          {/* Dots Indicator */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-10">
            {product.images.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => { setCurrentImage(idx); setIsAutoPlaying(false); }}
                className={`h-2 rounded-full transition-all duration-300 ${currentImage === idx ? 'bg-slate-900 w-6 shadow-sm' : 'bg-slate-300 w-2'}`}
              />
            ))}
          </div>

          {!isAutoPlaying && (
            <div className="absolute top-4 right-4 z-20 bg-slate-900/10 backdrop-blur-sm text-slate-900 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-slate-900/5 pointer-events-none">
              Mode manuel
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-3.5 sm:p-5 md:p-12">
          <h1 className="text-xl md:text-3xl font-bold leading-tight text-slate-900 mb-4">
            {product.name}
          </h1>

          <div className="space-y-4">
            {/* Collapsible Description */}
            <div className="border border-brand-border rounded-xl overflow-hidden">
              <button 
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="w-full p-4 flex items-center justify-between bg-white group"
              >
                <h3 className="text-sm font-bold text-black uppercase tracking-wide">Description</h3>
                <div className={`transition-transform duration-300 ${isDescriptionExpanded ? 'rotate-180' : ''}`}>
                  <ChevronDown size={20} />
                </div>
              </button>
              
              <AnimatePresence>
                {isDescriptionExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-white px-4 pb-4"
                  >
                    <div className="pt-2 border-t border-slate-100 uppercase text-[10px] text-slate-400 font-bold mb-4 text-center">Détails du produit</div>
                    <div className="pb-2">
                      <FormattedDescription text={product.description} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Price Detail Section */}
            <div className="flex items-baseline gap-2 py-2">
              <div className="btn-price">
                {formatPrice(product.price)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400 line-through font-bold">
                  {formatPrice(product.originalPrice)}
                </span>
                {product.originalPrice > product.price && (
                  <motion.span 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 500, 
                      damping: 15,
                      delay: 0.2
                    }}
                    className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded flex items-center shadow-sm"
                  >
                    -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                  </motion.span>
                )}
                <div className="flex items-center ml-5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={10} fill={i < Math.floor(product.rating) ? "#f1c40f" : "none"} className={i < Math.floor(product.rating) ? "text-[#f1c40f]" : "text-slate-300"} />
                  ))}
                  <span className="text-[10px] font-bold text-slate-500 ml-1">
                    ({reviews.length})
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 space-y-4">
            {/* Embedded Checkout Form */}
            <div className="pt-2 scroll-mt-20" id="order-form">
              <CheckoutForm 
                product={product} 
                onShowToast={onShowToast}
                onClose={onClose}
                formatPrice={formatPrice}
              />
            </div>

            {/* Reviews Section */}
            <div className="pt-12 border-t border-brand-border" id="reviews-section">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-black uppercase tracking-tight">AVIS CLIENTS ({reviews.length})</h3>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={16} 
                      fill={i < Math.floor(product.rating) ? "#54b9ff" : "none"} 
                      className={i < Math.floor(product.rating) ? "text-[#54b9ff]" : "text-brand-border"}
                    />
                  ))}
                  <span className="ml-2 font-bold">{product.rating}</span>
                </div>
              </div>

              <div className="space-y-6">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="bg-white border border-brand-border rounded-2xl p-5 shadow-sm">
                      {/* ... (rest of review content stays same) */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-surface-alt flex items-center justify-center font-bold text-brand-accent">
                            {review.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{review.name}, {review.location}</div>
                            <div className="text-[11px] text-brand-text-muted">{review.date}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={12} 
                              fill={i < review.rating ? "#f1c40f" : "none"} 
                              className={i < review.rating ? "text-[#f1c40f]" : "text-brand-border"}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed mb-4 italic">
                        "{review.comment}"
                        {review.productName && (
                          <button 
                            onClick={() => onProductClick?.(review.productName!)}
                            className="text-[#54b9ff] font-bold hover:underline not-italic ml-1 inline-block"
                          >
                            {review.productName}
                          </button>
                        )}
                      </p>
                      {review.image && !review.images && (
                        <div className="rounded-xl overflow-hidden aspect-[16/9] max-w-[200px]">
                          <img 
                            src={review.image || undefined} 
                            alt="Avis client" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      {review.images && review.images.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {review.images.map((img, i) => (
                            <div key={i} className="rounded-xl overflow-hidden aspect-square w-24 md:w-32 border border-brand-border">
                              <img 
                                src={img} 
                                alt={`Avis client ${i + 1}`} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-white border border-brand-border rounded-2xl">
                    <p className="text-brand-text-muted font-medium italic">Aucun avis pour ce produit pour le moment.</p>
                  </div>
                )}
              </div>

              {!showAllReviews && reviews.length > 1000 && (
                <div className="mt-12 text-center">
                  <button 
                    onClick={() => setShowAllReviews(true)}
                    className="inline-flex items-center gap-2 bg-brand-accent text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest shadow-xl hover:bg-brand-accent-dark transition-all active:scale-95 group"
                  >
                    VOIR PLUS D'AVIS
                    <ChevronDown size={20} className="group-hover:translate-y-0.5 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Dashboard Mock Data ---
const DASHBOARD_DATA = [
  { name: '8 mars', visits: 400, sales: 240, orders: 2 },
  { name: '11 mars', visits: 1200, sales: 800, orders: 5 },
  { name: '14 mars', visits: 900, sales: 600, orders: 4 },
  { name: '17 mars', visits: 1500, sales: 1100, orders: 8 },
  { name: '20 mars', visits: 800, sales: 500, orders: 3 },
  { name: '23 mars', visits: 1100, sales: 900, orders: 6 },
  { name: '26 mars', visits: 1300, sales: 1000, orders: 7 },
  { name: '29 mars', visits: 1600, sales: 1400, orders: 10 },
  { name: '1 avr.', visits: 1400, sales: 1200, orders: 9 },
  { name: '4 avr.', visits: 1800, sales: 1600, orders: 12 },
  { name: '7 avr.', visits: 1700, sales: 1500, orders: 11 },
];

// --- Pin Modal Component ---
const PinModal = ({ isOpen, onClose, onSuccess, onShowToast }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}) => {
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const savedAttempts = localStorage.getItem('admin_failed_attempts');
    const savedLockout = localStorage.getItem('admin_lockout_until');
    
    if (savedAttempts) setAttempts(parseInt(savedAttempts));
    if (savedLockout) {
      const until = parseInt(savedLockout);
      if (until > Date.now()) {
        setLockoutTime(until);
      } else {
        localStorage.removeItem('admin_lockout_until');
        localStorage.setItem('admin_failed_attempts', '0');
        setAttempts(0);
        setLockoutTime(null);
      }
    }
  }, [isOpen]);

  const handlePinChange = (value: string) => {
    const newPin = value.replace(/\D/g, '');
    setPin(newPin);
    
    // Auto-submit when 4 digits are reached
    if (newPin.length === 4) {
      validatePin(newPin);
    }
  };

  const validatePin = (pinToValidate: string) => {
    if (lockoutTime && lockoutTime > Date.now()) {
      const minutesLeft = Math.ceil((lockoutTime - Date.now()) / 60000);
      onShowToast(`Accès bloqué. Réessayez dans ${minutesLeft} minutes.`, 'error');
      return;
    }

    if (pinToValidate === '5286') {
      localStorage.setItem('admin_failed_attempts', '0');
      setPin('');
      setAttempts(0);
      onSuccess();
      onClose();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem('admin_failed_attempts', newAttempts.toString());
      setPin('');
      
      if (newAttempts >= 3) {
        const until = Date.now() + 3600000; // 1 hour
        setLockoutTime(until);
        localStorage.setItem('admin_lockout_until', until.toString());
        onShowToast('Trop de tentatives. Accès bloqué pour 1 heure.', 'error');
      } else {
        onShowToast(`Code incorrect. ${3 - newAttempts} tentatives restantes.`, 'error');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 4) {
      validatePin(pin);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white max-w-[320px] w-full rounded-xl p-6 shadow-2xl border border-slate-200"
      >
        <div className="w-12 h-12 bg-brand-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock size={24} className="text-brand-accent" />
        </div>
        
        <h2 className="text-xl font-bold text-center text-slate-900 mb-1">Code d'accès</h2>
        <p className="text-slate-500 text-center text-[13px] mb-6">
          Veuillez entrer le code à 4 chiffres pour accéder au Dashboard.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center gap-3">
            <input 
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => handlePinChange(e.target.value)}
              className="w-full text-center text-2xl tracking-[0.8em] font-bold py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-brand-accent outline-none transition-all"
              placeholder="****"
              autoFocus
            />
          </div>

          {lockoutTime && lockoutTime > Date.now() && (
            <p className="text-rose-600 text-[10px] text-center font-bold">
              Accès bloqué jusqu'à {new Date(lockoutTime).toLocaleTimeString()}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <button 
              type="submit"
              disabled={!!(lockoutTime && lockoutTime > Date.now())}
              className="w-full bg-brand-accent text-white font-bold py-3 rounded-lg hover:bg-brand-accent-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Valider
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="w-full text-slate-400 text-xs font-bold hover:text-slate-600 py-1"
            >
              Annuler
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const ContactPage = ({ onBack }: { onBack: () => void }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-brand-surface pt-24 md:pt-32 pb-20"
    >
      <div className="max-w-4xl mx-auto px-6">
        <button 
          onClick={onBack}
          className="mb-8 w-10 h-10 rounded-full bg-brand-surface-alt flex items-center justify-center text-brand-text-muted hover:bg-brand-accent hover:text-white transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-brand-border">
          <div className="w-full">
            <img 
              src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgSqhKOJfpW0ZBRboeMWFILnUuGbgeaNXudIdObKipScfL-EOLGXeozjTqGtk5NRJIHs0ZTu8fa4MMr3yRmuXJelhyrW6ml3MC9ETgZvJXlWL0Azv1Y-L3ZKJVD8EYZL7s7q-cWFeDeGj8UcDFhzFIygsQhqSwD4Nhux1rmTE_nhlqjZu-9w5n57fVR4Yk/s800/2.webp" 
              alt="Contact Support" 
              className="w-full h-auto block"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="p-8 md:p-12 space-y-6 text-black leading-relaxed text-base md:text-lg">
            <p>
              Aucune inquiétude : <strong>notre équipe se fera un véritable plaisir de vous accompagner à chaque étape de votre expérience d’achat.</strong> Que vous ayez une question sur un produit, besoin d’aide pour finaliser votre commande ou envie d’un conseil personnalisé, nous sommes là pour vous répondre avec attention, bienveillance et réactivité.
            </p>
            
            <p>
              Votre satisfaction n’est pas seulement importante pour nous : <strong>elle est au cœur même de notre mission.</strong> Nous mettons tout en œuvre pour que votre parcours sur notre boutique soit simple, fluide et agréable, du premier clic jusqu’à la réception de votre commande.
            </p>

            <p>
              Nous croyons que chaque client mérite une expérience claire, transparente et sans stress. C’est pourquoi nous améliorons constamment nos services, notre communication et notre support afin de vous offrir le meilleur.
            </p>

            <p className="font-bold italic">
              N’hésitez donc jamais à nous contacter : nous sommes là pour vous, toujours avec le sourire.
            </p>

            <div className="pt-8 border-t border-brand-border flex flex-col gap-8 items-center">
              <a 
                href="https://wa.me/221768830695" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-4 hover:opacity-80 transition-opacity group"
              >
                <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-lg shadow-green-100 group-hover:scale-110 transition-transform">
                  <svg 
                    viewBox="0 0 24 24" 
                    width="28" 
                    height="28" 
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-brand-text-muted font-bold uppercase tracking-widest">WhatsApp</p>
                  <p className="text-xl font-black text-black">+221 76 883 06 95</p>
                </div>
              </a>

              <div className="flex flex-col items-center gap-4">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-brand-text-muted">Suivez-nous</p>
                <div className="flex gap-4 justify-center">
                  <a 
                    href="https://www.tiktok.com/@vintech_afrik?is_from_webapp=1&sender_device=pc" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-black hover:bg-brand-accent hover:text-white transition-all"
                  >
                    <svg 
                      viewBox="0 0 24 24" 
                      width="24" 
                      height="24" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      fill="none" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                    </svg>
                  </a>
                  <a 
                    href="https://www.instagram.com/vintech_afrik/?utm_source=ig_web_button_share_sheet" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-black hover:bg-brand-accent hover:text-white transition-all"
                  >
                    <Instagram size={24} />
                  </a>
                  <a 
                    href="https://www.facebook.com/share/17axqGhxkr/?mibextid=wwXIfr" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-black hover:bg-brand-accent hover:text-white transition-all"
                  >
                    <Facebook size={24} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AdminDashboard = ({ onBack, formatPrice, onShowToast }: { onBack: () => void, formatPrice: (price: number) => string, onShowToast: (msg: string, type?: 'success' | 'error') => void }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ visits: 0, sales: 0, orders: 0, conversion: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [allOrdersInRange, setAllOrdersInRange] = useState<any[]>([]);
  const [allOrdersInPrevRange, setAllOrdersInPrevRange] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [unpaidOrders, setUnpaidOrders] = useState<any[]>([]);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [allVisitsInRange, setAllVisitsInRange] = useState<Map<string, number>>(new Map());
  const [allVisitsInPrevRange, setAllVisitsInPrevRange] = useState<Map<string, number>>(new Map());
  const [liveVisitors, setLiveVisitors] = useState(0);
  const [selectedStat, setSelectedStat] = useState<'visits' | 'orders' | 'sales'>('visits');
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'last7days' | 'last30days' | 'custom'>('today');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'unpaid'>('all');
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);

  const [activeTab, setActiveTab] = useState<'orders' | 'reviews'>('orders');
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    if (!isPinVerified) return;

    // Fetch Reviews
    const reviewsQuery = query(
      collection(db, 'reviews'),
      orderBy('createdAt', 'desc')
    );

    const reviewsUnsubscribe = onSnapshot(
      reviewsQuery,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setReviews(data);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'reviews')
    );

    return () => {
      reviewsUnsubscribe();
    };
  }, [isPinVerified]);

  const deleteReview = async (reviewId: string) => {
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      onShowToast('Avis supprimé avec succès');
    } catch (err) {
      onShowToast('Erreur lors de la suppression', 'error');
      handleFirestoreError(err, OperationType.DELETE, `reviews/${reviewId}`);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // --- Clarity Tracking ---
    const clarityId = (import.meta as any).env.VITE_CLARITY_ID || 'w8ounwp3ex';
    if (clarityId && typeof window !== 'undefined') {
      (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", clarityId);
    }

    // --- Meta Pixel Tracking ---
    const pixelId = (import.meta as any).env.VITE_META_PIXEL_ID || '2047759392706232';
    if (pixelId && typeof window !== 'undefined') {
      const w = window as any;
      const d = document;
      const s = 'script';
      const f = 'https://connect.facebook.net/en_US/fbevents.js';
      
      if (!w.fbq) {
        w.fbq = function() {
          w.fbq.callMethod ? w.fbq.callMethod.apply(w.fbq, arguments) : w.fbq.queue.push(arguments);
        };
        if (!w._fbq) w._fbq = w.fbq;
        w.fbq.push = w.fbq;
        w.fbq.loaded = !0;
        w.fbq.version = '2.0';
        w.fbq.queue = [];
        const t = d.createElement(s) as any;
        t.async = !0;
        t.src = f;
        const n = d.getElementsByTagName(s)[0];
        n.parentNode?.insertBefore(t, n);
      }
      w.fbq('init', pixelId);
      w.fbq('track', 'PageView');
    }
  }, []);

  const filterOptions = [
    { id: 'today', label: "Aujourd'hui" },
    { id: 'yesterday', label: "Hier" },
    { id: 'last7days', label: "7 derniers jours" },
    { id: 'last30days', label: "30 derniers jours" },
    { id: 'custom', label: "Période personnalisée" },
  ];

  const getDateRange = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    let prevStart = new Date();
    let prevEnd = new Date();

    // Reset times for current
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    // Reset times for previous
    prevStart.setHours(0, 0, 0, 0);
    prevEnd.setHours(23, 59, 59, 999);

    switch (dateFilter) {
      case 'today':
        prevStart.setDate(now.getDate() - 1);
        prevEnd.setDate(now.getDate() - 1);
        break;
      case 'yesterday':
        start.setDate(now.getDate() - 1);
        end.setDate(now.getDate() - 1);
        prevStart.setDate(now.getDate() - 2);
        prevEnd.setDate(now.getDate() - 2);
        break;
      case 'last7days':
        start.setDate(now.getDate() - 6);
        prevStart.setDate(now.getDate() - 13);
        prevEnd.setDate(now.getDate() - 7);
        break;
      case 'last30days':
        start.setDate(now.getDate() - 29);
        prevStart.setDate(now.getDate() - 59);
        prevEnd.setDate(now.getDate() - 30);
        break;
      case 'custom':
        if (customRange.start && customRange.end) {
          start = new Date(customRange.start);
          start.setHours(0, 0, 0, 0);
          end = new Date(customRange.end);
          end.setHours(23, 59, 59, 999);
          
          const diff = end.getTime() - start.getTime();
          prevStart = new Date(start.getTime() - diff - 86400000);
          prevStart.setHours(0, 0, 0, 0);
          prevEnd = new Date(start.getTime() - 86400000);
          prevEnd.setHours(23, 59, 59, 999);
        }
        break;
    }
    return { current: { start, end }, previous: { start: prevStart, end: prevEnd } };
  }, [dateFilter, customRange]);

  const formatPriceLocal = (price: number) => {
    const config = COUNTRY_CONFIG['SN'];
    const convertedPrice = Math.round(price * config.exchangeRate);
    return `${convertedPrice.toLocaleString('de-DE')} FCFA`;
  };

  const displayOrders = useMemo(() => {
    if (orderFilter === 'pending') {
      return pendingOrders;
    }
    if (orderFilter === 'unpaid') {
      return unpaidOrders;
    }
    if (showAllOrders) {
      return allOrders;
    }
    return recentOrders;
  }, [showAllOrders, allOrders, recentOrders, orderFilter, pendingOrders, unpaidOrders]);

  const MONTHS_FR_SHORT = [
    'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
    'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'
  ];

  const MONTHS_FR_FULL = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const formatXAxis = (dateStr: string) => {
    if (dateFilter === 'today' || dateFilter === 'yesterday') {
      return `${dateStr}h`;
    }
    const date = new Date(dateStr);
    return date.getDate().toString();
  };

  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    
    if (dateFilter === 'today' || dateFilter === 'yesterday') {
      let label = `${payload.value}h`;
      let textAnchor = "middle";
      let dx = 0;

      if (isMobile) {
        if (payload.value === '0') {
          label = '12:00 AM';
          textAnchor = "start";
          dx = -4;
        } else if (payload.value === '10') {
          label = '10:00 AM';
        } else if (payload.value === '20') {
          label = '8:00 PM';
          textAnchor = "end";
          dx = 4;
        }
      }

      return (
        <g transform={`translate(${x},${y})`}>
          <text x={dx} y={0} dy={16} textAnchor={textAnchor as any} fill="#64748b" fontSize={isMobile ? 10 : 12} fontWeight="500">
            {label}
          </text>
        </g>
      );
    }

    const date = new Date(payload.value);
    const day = date.getDate();
    const monthName = MONTHS_FR_FULL[date.getMonth()];
    const monthShort = MONTHS_FR_SHORT[date.getMonth()];

    const diffDays = Math.ceil(Math.abs(getDateRange.current.end.getTime() - getDateRange.current.start.getTime()) / (1000 * 60 * 60 * 24));

    if (dateFilter === 'custom' && diffDays > 30) {
      if (diffDays > 180) {
        // Showing quarters/3-month blocks
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return (
          <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={16} textAnchor="middle" fill="#64748b" fontSize={11} fontWeight="600">
              T{quarter} {date.getFullYear()}
            </text>
          </g>
        );
      }
      return (
        <g transform={`translate(${x},${y})`}>
          <text x={0} y={0} dy={16} textAnchor="middle" fill="#64748b" fontSize={12} fontWeight="500">
            {monthShort}
          </text>
        </g>
      );
    }

    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill="#64748b" fontSize={13} fontWeight="500">
          {day} {(dateFilter === 'last7days' || dateFilter === 'last30days' || dateFilter === 'custom') ? monthShort : ''}
        </text>
        {day === 1 && dateFilter === 'last30days' && (
          <text x={0} y={0} dy={36} textAnchor="middle" fill="#94a3b8" fontSize={11} fontWeight="bold">
            mois de {monthName}
          </text>
        )}
      </g>
    );
  };

  const getXAxisTicks = useMemo(() => {
    if (chartData.length === 0) return [];
    
    if (dateFilter === 'today' || dateFilter === 'yesterday') {
      if (isMobile) {
        return ['0', '10', '20'];
      }
      // Every 2 hours: 0, 2, 4, ..., 22
      return [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map(h => h.toString());
    }

    if (dateFilter === 'last7days') {
      // Every 2nd day from the end to ensure today is visible and improve readability
      return chartData
        .filter((_, idx) => (chartData.length - 1 - idx) % 2 === 0)
        .map(item => item.name);
    }

    const diffDays = Math.ceil(Math.abs(getDateRange.current.end.getTime() - getDateRange.current.start.getTime()) / (1000 * 60 * 60 * 24));
    if (dateFilter === 'custom' && diffDays > 30) {
      return chartData.map(item => item.name);
    }

    // Every 10 days from the end to ensure today is visible and improve readability
    return chartData
      .filter((_, idx) => (chartData.length - 1 - idx) % 10 === 0)
      .map(item => item.name);
  }, [chartData, dateFilter]);

  const formatYAxis = (value: number) => {
    if (value === 0) return '0';
    if (selectedStat === 'sales') {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)} M`;
      if (value >= 1000) return `${(value / 1000).toFixed(0)} k`;
      return value.toString();
    }
    if (value >= 1000) return `${(value / 1000).toFixed(0)} k`;
    return value.toString();
  };

  const chartHeight = useMemo(() => {
    let maxVal = 0;
    let unitPerCm = 1000; // Default for visits

    if (selectedStat === 'visits') {
      maxVal = Math.max(...chartData.map(d => d.visits || 0), 1000);
      unitPerCm = 1000;
    } else if (selectedStat === 'sales') {
      maxVal = Math.max(...chartData.map(d => d.sales || 0), 100000);
      unitPerCm = 100000; // 100k FCFA = 1cm
    } else if (selectedStat === 'orders') {
      maxVal = Math.max(...chartData.map(d => d.orders || 0), 5);
      unitPerCm = 1; // 1 order = 1cm
    }

    // 1cm (approx 38px)
    const calculatedHeight = (maxVal / unitPerCm) * 38;
    return Math.max(350, Math.min(600, calculatedHeight));
  }, [chartData, selectedStat]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      
      // Check if already PIN verified in this session
      const verified = sessionStorage.getItem('admin_pin_verified') === 'true';
      setIsPinVerified(verified);
      
      // We set loading to false regardless of auth state to allow PIN-based access
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isPinVerified) return;

    const { current, previous } = getDateRange;
    const fetchStart = previous.start;
    const fetchEnd = current.end;

    // Fetch Orders
    const ordersQuery = query(
      collection(db, 'orders'), 
      where('createdAt', '>=', Timestamp.fromDate(fetchStart)),
      where('createdAt', '<=', Timestamp.fromDate(fetchEnd)),
      orderBy('createdAt', 'desc')
    );

    const ordersUnsubscribe = onSnapshot(
      ordersQuery, 
      (snapshot) => {
        const allOrders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        
        // Filter by country (legacy orders without country field are treated as SN)
        const orders = allOrders.filter((o: any) => o.country === 'SN' || !o.country);
        
        // Split orders
        const currentOrders = orders.filter((o: any) => {
          const d = o.createdAt instanceof Timestamp ? o.createdAt.toDate() : new Date(o.createdAt);
          return d >= current.start && d <= current.end;
        });
        
        const previousOrders = orders.filter((o: any) => {
          const d = o.createdAt instanceof Timestamp ? o.createdAt.toDate() : new Date(o.createdAt);
          return d >= previous.start && d <= previous.end;
        });

        setRecentOrders(currentOrders.slice(0, 5));
        setAllOrdersInRange(currentOrders);
        setAllOrdersInPrevRange(previousOrders);
        
        const totalSales = currentOrders.reduce((acc: number, order: any) => acc + (order.total || 0), 0);
        const totalOrders = currentOrders.length;
        
        setStats(prev => ({ ...prev, sales: totalSales, orders: totalOrders }));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'orders')
    );

    // Fetch store-wide pending counts
    const pendingQuery = query(
      collection(db, 'orders'),
      where('status', '==', 'pending')
    );
    const pendingUnsubscribe = onSnapshot(pendingQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
        .filter((o: any) => o.country === 'SN' || !o.country);
      setPendingOrders(data);
      setPendingOrdersCount(data.length);
    });

    const unpaidQuery = query(
      collection(db, 'orders'),
      where('paymentStatus', '==', 'unpaid')
    );
    const unpaidUnsubscribe = onSnapshot(unpaidQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
        .filter((o: any) => o.country === 'SN' || !o.country);
      setUnpaidOrders(data);
      setPendingPaymentsCount(data.length);
    });

    // Fetch Visits
    const formatDateId = (date: Date) => date.toISOString().split('T')[0];
    const startId = formatDateId(fetchStart);
    const endId = formatDateId(fetchEnd);

    const visitsQuery = query(
      collection(db, 'visits'),
      where('__name__', '>=', startId),
      where('__name__', '<=', endId),
      orderBy('__name__', 'desc')
    );

    const visitsUnsubscribe = onSnapshot(
      visitsQuery, 
      (snapshot) => {
        const currentVisits = new Map();
        const previousVisits = new Map();
        
        const currStartId = formatDateId(current.start);
        const currEndId = formatDateId(current.end);
        const prevStartId = formatDateId(previous.start);
        const prevEndId = formatDateId(previous.end);

        snapshot.docs.forEach(doc => {
          const id = doc.id;
          const data = doc.data();
          // Use country-specific count, fallback to global count only for Senegal (legacy)
          const count = data[`count_SN`] ?? (data.count || 0);
          
          if (id >= currStartId && id <= currEndId) {
            currentVisits.set(id, count);
          }
          if (id >= prevStartId && id <= prevEndId) {
            previousVisits.set(id, count);
          }
        });

        setAllVisitsInRange(currentVisits);
        setAllVisitsInPrevRange(previousVisits);
        
        const totalVisits = Array.from(currentVisits.values()).reduce((acc: number, v: any) => acc + (v as number), 0);
        setStats(prev => ({ ...prev, visits: totalVisits }));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'visits')
    );

    // Fetch Live Visitors (Presence in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const presenceUnsubscribe = onSnapshot(
      collection(db, 'presence'), 
      (snapshot) => {
        const active = snapshot.docs.filter(doc => {
          const data = doc.data();
          return data.lastSeen && data.lastSeen.toDate() > fiveMinutesAgo;
        });
        setLiveVisitors(active.length);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'presence')
    );

    // Fetch All Orders (for "View All")
    const allOrdersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );
    const allOrdersUnsubscribe = onSnapshot(allOrdersQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
        .filter((o: any) => o.country === 'SN' || !o.country);
      setAllOrders(data);
    });

    return () => {
      ordersUnsubscribe();
      pendingUnsubscribe();
      unpaidUnsubscribe();
      visitsUnsubscribe();
      presenceUnsubscribe();
      allOrdersUnsubscribe();
    };
  }, [isPinVerified, getDateRange]);

  useEffect(() => {
    if (!isPinVerified) return;

    const { current, previous } = getDateRange;
    const fullData = [];

    const processOrders = (orders: any[]) => {
      const grouped = new Map();
      orders.forEach(order => {
        const date = order.createdAt instanceof Timestamp ? order.createdAt.toDate() : new Date(order.createdAt);
        const dateId = date.toISOString().split('T')[0];
        const hour = date.getHours();
        
        if (!grouped.has(dateId)) {
          grouped.set(dateId, { count: 0, sales: 0, hourly: Array(24).fill(0).map(() => ({ count: 0, sales: 0 })) });
        }
        const dayData = grouped.get(dateId);
        dayData.count += 1;
        dayData.sales += (order.total || 0);
        dayData.hourly[hour].count += 1;
        dayData.hourly[hour].sales += (order.total || 0);
      });
      return grouped;
    };

    const currentOrdersByDate = processOrders(allOrdersInRange);
    const previousOrdersByDate = processOrders(allOrdersInPrevRange);

    if (dateFilter === 'today' || dateFilter === 'yesterday') {
      const currDateId = current.start.toISOString().split('T')[0];
      const prevDateId = previous.start.toISOString().split('T')[0];
      
      const currVisits = allVisitsInRange.get(currDateId) || 0;
      const prevVisits = allVisitsInPrevRange.get(prevDateId) || 0;
      
      const currDayOrders = currentOrdersByDate.get(currDateId) || { count: 0, sales: 0, hourly: Array(24).fill(0).map(() => ({ count: 0, sales: 0 })) };
      const prevDayOrders = previousOrdersByDate.get(prevDateId) || { count: 0, sales: 0, hourly: Array(24).fill(0).map(() => ({ count: 0, sales: 0 })) };
      
      const currentHour = new Date().getHours();
      const isToday = dateFilter === 'today';
      
      for (let h = 0; h < 24; h++) {
        const factor = Math.sin((h - 6) * Math.PI / 12) + 1.2; 
        const hourlyVisits = Math.floor((currVisits / 24) * factor);
        const prevHourlyVisits = Math.floor((prevVisits / 24) * factor);
        
        const isActual = !isToday || h <= currentHour;
        const isForecast = isToday && h >= currentHour && h <= currentHour + 2;

        fullData.push({
          name: h.toString(),
          visits: isActual ? hourlyVisits : undefined,
          forecastVisits: isForecast ? hourlyVisits : undefined,
          orders: isActual ? currDayOrders.hourly[h].count : undefined,
          forecastOrders: isForecast ? Math.max(currDayOrders.hourly[h].count, Math.floor(hourlyVisits * 0.02)) : undefined,
          sales: isActual ? currDayOrders.hourly[h].sales : undefined,
          forecastSales: isForecast ? Math.max(currDayOrders.hourly[h].sales, hourlyVisits * 150) : undefined,
          previousVisits: prevHourlyVisits,
          previousOrders: prevDayOrders.hourly[h].count,
          previousSales: prevDayOrders.hourly[h].sales
        });
      }
    } else {
      const diffDays = Math.ceil(Math.abs(current.end.getTime() - current.start.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dateFilter === 'custom' && diffDays > 30) {
        // Group by month or 3-month blocks
        const isLongRange = diffDays > 180;
        const interval = isLongRange ? 3 : 1;
        
        let temp = new Date(current.start);
        temp.setDate(1); // Start at beginning of month
        
        while (temp <= current.end) {
          const blockStart = new Date(temp);
          const blockEnd = new Date(temp);
          blockEnd.setMonth(blockEnd.getMonth() + interval);
          blockEnd.setDate(0); // Last day of the interval
          
          const dateId = blockStart.toISOString().split('T')[0];
          
          const currOrders = allOrdersInRange.filter(o => {
            const d = o.createdAt instanceof Timestamp ? o.createdAt.toDate() : new Date(o.createdAt);
            return d >= blockStart && d <= blockEnd;
          });
          
          // For previous period, we need to shift back by the exact duration
          const duration = current.end.getTime() - current.start.getTime();
          const pBlockStart = new Date(blockStart.getTime() - duration);
          const pBlockEnd = new Date(blockEnd.getTime() - duration);

          const prevOrders = allOrdersInPrevRange.filter(o => {
            const d = o.createdAt instanceof Timestamp ? o.createdAt.toDate() : new Date(o.createdAt);
            return d >= pBlockStart && d <= pBlockEnd;
          });

          let currVisits = 0;
          allVisitsInRange.forEach((count, id) => {
            const d = new Date(id);
            if (d >= blockStart && d <= blockEnd) currVisits += count;
          });

          let prevVisits = 0;
          allVisitsInPrevRange.forEach((count, id) => {
            const d = new Date(id);
            if (d >= pBlockStart && d <= pBlockEnd) prevVisits += count;
          });

          fullData.push({
            name: dateId,
            visits: currVisits,
            orders: currOrders.length,
            sales: currOrders.reduce((acc: number, o: any) => acc + (o.total || 0), 0),
            previousVisits: prevVisits,
            previousOrders: prevOrders.length,
            previousSales: prevOrders.reduce((acc: number, o: any) => acc + (o.total || 0), 0)
          });
          
          temp.setMonth(temp.getMonth() + interval);
        }
      } else {
        const currDays = [];
        let temp = new Date(current.start);
        while (temp <= current.end) {
          currDays.push(new Date(temp));
          temp.setDate(temp.getDate() + 1);
        }

        const prevDays = [];
        temp = new Date(previous.start);
        while (temp <= previous.end) {
          prevDays.push(new Date(temp));
          temp.setDate(temp.getDate() + 1);
        }

        currDays.forEach((date, idx) => {
          const currDateId = date.toISOString().split('T')[0];
          const prevDate = prevDays[idx];
          const prevDateId = prevDate ? prevDate.toISOString().split('T')[0] : null;

          const currVisits = allVisitsInRange.get(currDateId) || 0;
          const prevVisits = prevDateId ? (allVisitsInPrevRange.get(prevDateId) || 0) : 0;

          const currDayStats = currentOrdersByDate.get(currDateId) || { count: 0, sales: 0 };
          const prevDayStats = prevDateId ? (previousOrdersByDate.get(prevDateId) || { count: 0, sales: 0 }) : { count: 0, sales: 0 };

          fullData.push({ 
            name: currDateId, 
            visits: currVisits,
            orders: currDayStats.count,
            sales: currDayStats.sales,
            previousVisits: prevVisits,
            previousOrders: prevDayStats.count,
            previousSales: prevDayStats.sales
          });
        });
      }
    }

    setChartData(fullData);
  }, [isPinVerified, allOrdersInRange, allOrdersInPrevRange, allVisitsInRange, allVisitsInPrevRange, dateFilter, getDateRange]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const currentVal = payload.find((p: any) => p.dataKey === selectedStat)?.value || 0;
      const prevVal = payload.find((p: any) => p.dataKey === `previous${selectedStat.charAt(0).toUpperCase() + selectedStat.slice(1)}`)?.value || 0;
      
      let percentChange = 0;
      if (prevVal > 0) {
        percentChange = Math.round(((currentVal - prevVal) / prevVal) * 100);
      } else if (currentVal > 0) {
        percentChange = 100;
      }

      const isPositive = percentChange >= 0;
      const absChange = Math.abs(percentChange);

      const formatTooltipDate = (dateStr: string, isPrevious: boolean) => {
        if (dateFilter === 'today' || dateFilter === 'yesterday') {
          const baseDate = isPrevious ? getDateRange.previous.start : getDateRange.current.start;
          const date = new Date(baseDate);
          const day = date.getDate();
          const month = MONTHS_FR_SHORT[date.getMonth()];
          const year = date.getFullYear();
          return `${day} ${month} ${year}, ${dateStr}:00`;
        } else {
          const currentDate = new Date(dateStr);
          if (isPrevious) {
             const diffDays = Math.round((currentDate.getTime() - getDateRange.current.start.getTime()) / (1000 * 60 * 60 * 24));
             const prevDate = new Date(getDateRange.previous.start);
             prevDate.setDate(prevDate.getDate() + diffDays);
             const day = prevDate.getDate();
             const month = MONTHS_FR_SHORT[prevDate.getMonth()];
             const year = prevDate.getFullYear();
             return `${day} ${month} ${year}`;
          } else {
             const day = currentDate.getDate();
             const month = MONTHS_FR_SHORT[currentDate.getMonth()];
             const year = currentDate.getFullYear();
             return `${day} ${month} ${year}`;
          }
        }
      };

      const statLabel = selectedStat === 'visits' ? 'Visites' : selectedStat === 'orders' ? 'Commandes' : 'Ventes';

      const formatValue = (val: number) => {
        if (selectedStat === 'sales') {
          return formatPriceLocal(val);
        }
        return val.toLocaleString();
      };

      return (
        <div className="bg-white p-2.5 border border-slate-200 shadow-xl rounded-lg min-w-[180px]">
          <div className="text-slate-900 font-bold mb-1.5 text-[13px]">{statLabel}</div>
          
          {/* Current Period */}
          <div className="mb-2">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-0.5">
              <span className="w-2 h-2 rounded-full bg-[#0080ff]" />
              {formatTooltipDate(label, false)}
            </div>
            <div className="inline-block px-1.5 py-0.5 bg-slate-100 rounded text-slate-900 font-medium text-[12px] ml-3.5">
              {formatValue(currentVal)}
            </div>
          </div>

          {/* Comparison */}
          <div className="flex items-center gap-1.5 text-[11px] mb-2 ml-3.5">
            <span className={`flex items-center gap-1 font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isPositive ? '↗' : '↘'} {absChange} %
            </span>
            <span className="text-slate-500">de la comparaison</span>
          </div>

          {/* Previous Period */}
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-0.5">
              <span className="w-2 h-2 rounded-full bg-[#a5d8ff]" />
              {formatTooltipDate(label, true)}
            </div>
            <div className="inline-block px-1.5 py-0.5 bg-slate-50 rounded text-slate-400 font-medium text-[12px] ml-3.5">
              {formatValue(prevVal)}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const updateOrderStatus = async (orderId: string, newStatus: 'delivered' | 'cancelled') => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { 
        status: newStatus,
        paymentStatus: newStatus === 'delivered' ? 'paid' : 'cancelled'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      onShowToast('Commande supprimée avec succès');
    } catch (err) {
      onShowToast('Erreur lors de la suppression', 'error');
      handleFirestoreError(err, OperationType.DELETE, `orders/${orderId}`);
    }
  };

  const updatePaymentStatus = async (orderId: string, newStatus: 'paid') => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { 
        paymentStatus: newStatus
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const updateOrderFull = async (orderId: string, updates: any) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), updates);
      setActiveActionMenu(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f7]">
        <div className="w-10 h-10 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isPinVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f7] px-6">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl border border-slate-200 shadow-xl text-center">
          <div className="w-20 h-20 bg-brand-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={40} className="text-brand-accent" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Accès Restreint</h2>
          <p className="text-slate-500 mb-8">Veuillez utiliser le code PIN pour accéder au tableau de bord.</p>
          <button onClick={onBack} className="w-full bg-brand-accent text-brand-bg font-bold py-4 rounded-xl hover:bg-brand-accent-dark transition-all">
            Retour au site
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f6f7] pt-20 md:pt-24 pb-20 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={onBack}
              className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all"
            >
              <ArrowLeft size={18} className="md:hidden" />
              <ArrowLeft size={20} className="hidden md:block" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 truncate">Tableau de bord</h1>
            <div className="relative ml-2 md:ml-4">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 md:px-3 md:py-2 shadow-sm">
                <img 
                  src={COUNTRY_CONFIG['SN'].flag} 
                  alt="" 
                  className="w-6 h-6 md:w-8 md:h-8 object-contain" 
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between lg:justify-end gap-2 md:gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="w-full lg:w-auto bg-white border border-slate-200 rounded-lg px-3 md:px-4 py-2 md:py-2.5 flex items-center justify-between lg:justify-start gap-2 text-xs md:text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
              >
                <div className="flex items-center gap-2 truncate">
                  <Calendar size={16} className="text-slate-500 shrink-0" />
                  <span className="truncate">{filterOptions.find(o => o.id === dateFilter)?.label}</span>
                </div>
                <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isFilterOpen && (
                  <>
                    {/* Mobile Backdrop */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsFilterOpen(false)}
                      className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[90] lg:hidden"
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="fixed lg:absolute left-4 right-4 lg:left-auto lg:right-0 top-[15%] lg:top-full mt-2 lg:w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl z-[100] overflow-hidden mx-auto"
                      style={{ maxWidth: '400px' }}
                    >
                      <div className="p-1.5 md:p-2">
                        {filterOptions.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => {
                              setDateFilter(option.id as any);
                              if (option.id !== 'custom') setIsFilterOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 md:px-4 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all ${
                              dateFilter === option.id 
                                ? 'bg-brand-accent text-brand-bg' 
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>

                      {dateFilter === 'custom' && (
                        <div className="p-4 md:p-5 border-t border-slate-100 bg-slate-50/50">
                          <div className="space-y-3 md:space-y-4">
                            <div>
                              <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Date de début</label>
                              <input 
                                type="date" 
                                value={customRange.start}
                                onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Date de fin</label>
                              <input 
                                type="date" 
                                value={customRange.end}
                                onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all"
                              />
                            </div>
                            <button 
                              onClick={() => setIsFilterOpen(false)}
                              className="w-full bg-brand-accent text-brand-bg text-xs md:text-sm font-black py-2.5 md:py-3 rounded-xl hover:bg-brand-accent-dark shadow-lg shadow-brand-accent/20 transition-all active:scale-95"
                            >
                              Appliquer
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-3 border-l border-slate-200 shrink-0">
              <div className="text-right hidden sm:block">
                <div className="text-xs md:text-sm font-bold text-slate-900 truncate max-w-[100px] md:max-w-none">{user?.displayName || 'Admin'}</div>
                <div className="text-[10px] md:text-xs text-slate-500 truncate max-w-[100px] md:max-w-none">{user?.email || 'Session PIN'}</div>
              </div>
              {user?.photoURL ? (
                <img src={user.photoURL} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-sm shrink-0" alt="Profile" />
              ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-sm shrink-0 bg-white flex items-center justify-center overflow-hidden">
                  <img 
                    src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEghnp-vjbnuQNUn5n8ElxyoWiUQGnYXlXqt9dEPNBOMuM716D1CRdlEMDGlt4iRhIOmRDWajOHolrpay_KLCZDx0izg2ypt-aDBQ3UEycricTkyeOarp2Cd8NwaF6ewQIVsw0NyPUiF18D0LoqE8_JwJesl-cSt6rl2iwZTDbqzG6xu20WxQpFc-oDXGuo/s800/Design_sans_titre-removebg-preview.webp" 
                    alt="Logo" 
                    className="w-full h-full object-contain p-1"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <button onClick={() => logout()} className="p-1.5 md:p-2 text-slate-400 hover:text-rose-600 transition-colors shrink-0">
                <X size={18} className="md:hidden" />
                <X size={20} className="hidden md:block" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid - Shopify Style */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
          <div className="flex flex-wrap md:flex-nowrap">
            {[
              { 
                label: 'Visites', 
                value: stats.visits.toLocaleString(), 
                change: '↘ 14 %', 
                id: 'visits' as const,
                hasEdit: true
              },
              { 
                label: 'Ventes totales', 
                value: formatPriceLocal(stats.sales), 
                change: '↘ 44 %', 
                id: 'sales' as const 
              },
              { 
                label: 'Commandes', 
                value: stats.orders.toString(), 
                change: '↘ 38 %', 
                id: 'orders' as const 
              },
              { 
                label: 'Taux de conversion', 
                value: stats.visits > 0 ? `${((stats.orders / stats.visits) * 100).toFixed(0)} %` : '0 %', 
                change: '—', 
                id: 'conversion' as const 
              },
            ].map((stat, i) => (
              <div 
                key={i} 
                onClick={() => {
                  if (stat.id === 'visits' || stat.id === 'orders' || stat.id === 'sales') {
                    setSelectedStat(stat.id);
                  }
                }}
                className={`flex-1 p-5 min-w-[200px] transition-all cursor-pointer border-r border-slate-100 last:border-r-0 ${
                  (stat.id === selectedStat) 
                    ? 'bg-slate-50/80' 
                    : 'hover:bg-slate-50/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-slate-600 border-b border-dotted border-slate-400 pb-0.5">
                      {stat.label}
                    </span>
                    {stat.id === 'visits' && (
                      <div className="flex items-center gap-1.5 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse-zoom" />
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">
                          {liveVisitors} en ligne
                        </span>
                      </div>
                    )}
                  </div>
                  {stat.hasEdit && selectedStat === stat.id && (
                    <Pencil size={14} className="text-slate-400" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-slate-900">{stat.value}</span>
                  <span className={`text-[13px] font-medium ${stat.change.includes('↘') ? 'text-slate-500' : 'text-slate-400'}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart Section - Shopify Style */}
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm mb-6">
          <div style={{ height: `${chartHeight}px` }} className="w-full transition-all duration-500">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={chartData.length > 0 ? chartData : DASHBOARD_DATA} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f1f1" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={<CustomXAxisTick />}
                  ticks={getXAxisTicks}
                  interval={0}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 13, fill: '#64748b' }}
                  domain={[0, 'auto']}
                  tickFormatter={formatYAxis}
                  width={40}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                />
                <Line 
                  type="monotone" 
                  dataKey={`previous${selectedStat.charAt(0).toUpperCase() + selectedStat.slice(1)}`}
                  stroke="#a5d8ff" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 4, fill: '#a5d8ff', stroke: '#fff', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey={selectedStat} 
                  stroke="#0080ff" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, fill: '#0080ff', stroke: '#fff', strokeWidth: 2 }}
                />
                {dateFilter === 'today' && (
                  <Line 
                    type="monotone" 
                    dataKey={`forecast${selectedStat.charAt(0).toUpperCase() + selectedStat.slice(1)}`}
                    stroke="#0080ff" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    className="animate-forecast"
                    dot={false}
                    activeDot={false}
                    connectNulls
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 mb-6 gap-8">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`pb-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'orders' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Commandes
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'reviews' ? 'border-brand-accent text-brand-accent' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Avis clients
          </button>
        </div>

        {activeTab === 'orders' ? (
          <>
            {/* Shopify-like Summary Cards */}
            <div className="flex gap-3 mb-8">
              <div 
                onClick={() => setOrderFilter(orderFilter === 'pending' ? 'all' : 'pending')}
                className={`flex-1 bg-white rounded-xl border shadow-sm p-3 flex items-center gap-3 transition-all cursor-pointer min-w-0 ${
                  orderFilter === 'pending' ? 'border-brand-accent ring-1 ring-brand-accent' : 'border-slate-200 hover:border-brand-accent'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                  <Package size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-slate-900 font-bold text-sm leading-tight">
                    {pendingOrdersCount || 0} <span className="font-medium text-slate-500">commandes</span>
                  </div>
                  <div className="text-slate-500 font-medium text-sm leading-tight">
                    à traiter
                  </div>
                </div>
              </div>
              <div 
                onClick={() => setOrderFilter(orderFilter === 'unpaid' ? 'all' : 'unpaid')}
                className={`flex-1 bg-white rounded-xl border shadow-sm p-3 flex items-center gap-3 transition-all cursor-pointer min-w-0 ${
                  orderFilter === 'unpaid' ? 'border-brand-accent ring-1 ring-brand-accent' : 'border-slate-200 hover:border-brand-accent'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                  <CreditCard size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-slate-900 font-bold text-sm leading-tight">
                    {pendingPaymentsCount || 0} <span className="font-medium text-slate-500">paiements</span>
                  </div>
                  <div className="text-slate-500 font-medium text-sm leading-tight">
                    à saisir
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="font-bold text-slate-900">
                    {orderFilter === 'pending' ? 'Commandes à traiter' : 
                     orderFilter === 'unpaid' ? 'Paiements à saisir' :
                     showAllOrders ? 'Toutes les commandes' : 'Commandes récentes'}
                  </h2>
                  {orderFilter !== 'all' && (
                    <button 
                      onClick={() => setOrderFilter('all')}
                      className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full hover:bg-slate-200 transition-colors"
                    >
                      Effacer le filtre
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => {
                    setShowAllOrders(!showAllOrders);
                    setOrderFilter('all');
                  }}
                  className="text-sm font-bold text-[#0095ff] hover:underline"
                >
                  {showAllOrders ? 'Voir moins' : 'Voir tout'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Commande</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Client</th>
                      <th className="px-6 py-4">Total</th>
                      <th className="px-6 py-4">Paiement</th>
                      <th className="px-6 py-4">Statut</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayOrders.length > 0 ? displayOrders.map((order, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                          #{order.sequentialId || order.id.slice(-4).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          <div className="flex flex-col">
                            <span>{order.createdAt instanceof Timestamp ? order.createdAt.toDate().toLocaleDateString() : 'N/A'}</span>
                            <span className="text-[10px] text-slate-400">
                              {order.createdAt instanceof Timestamp ? order.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">{order.customerName}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{formatPriceLocal(order.total)}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                            order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
                            order.paymentStatus === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {order.paymentStatus === 'paid' ? 'Payé' : order.paymentStatus === 'cancelled' ? 'Annulé' : 'En attente'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                            order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 
                            order.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {order.status === 'delivered' ? 'Livré' : order.status === 'cancelled' ? 'Annulé' : order.status === 'pending' ? 'En attente' : order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right relative">
                          <div className="flex justify-end">
                            <button 
                              onClick={() => setActiveActionMenu(activeActionMenu === order.id ? null : order.id)}
                              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                            >
                              <MoreVertical size={18} />
                            </button>

                            <AnimatePresence>
                              {activeActionMenu === order.id && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-[110]" 
                                    onClick={() => setActiveActionMenu(null)}
                                  />
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="absolute right-6 top-12 w-56 bg-white rounded-xl border border-slate-200 shadow-2xl z-[120] overflow-hidden py-1"
                                  >
                                    <button 
                                      onClick={() => updateOrderFull(order.id, { status: 'delivered', paymentStatus: 'paid' })}
                                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 flex items-center gap-2"
                                    >
                                      <CheckCircle size={16} />
                                      Marquer payé et livré
                                    </button>
                                    <button 
                                      onClick={() => updateOrderFull(order.id, { status: 'delivered', paymentStatus: 'cancelled' })}
                                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                                    >
                                      <AlertCircle size={16} />
                                      Marquer annulé et livré
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setEditingOrder(order);
                                        setActiveActionMenu(null);
                                      }}
                                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                    >
                                      <Edit size={16} />
                                      Modifier
                                    </button>
                                    <div className="h-px bg-slate-100 my-1" />
                                    <button 
                                      onClick={() => deleteOrder(order.id)}
                                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                    >
                                      <Trash2 size={16} />
                                      Supprimer définitivement
                                    </button>
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                          Aucune commande pour le moment.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Edit Order Modal */}
            <AnimatePresence>
              {editingOrder && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setEditingOrder(null)}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
                  >
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <h3 className="text-lg font-bold text-slate-900">Modifier la commande</h3>
                      <button onClick={() => setEditingOrder(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} />
                      </button>
                    </div>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nom du client</label>
                        <input 
                          type="text" 
                          value={editingOrder.customerName}
                          onChange={(e) => setEditingOrder({...editingOrder, customerName: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-accent outline-none transition-all text-base"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Téléphone</label>
                        <input 
                          type="text" 
                          value={editingOrder.customerPhone}
                          onChange={(e) => setEditingOrder({...editingOrder, customerPhone: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-accent outline-none transition-all text-base"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Adresse</label>
                        <textarea 
                          value={editingOrder.customerAddress}
                          onChange={(e) => setEditingOrder({...editingOrder, customerAddress: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-accent outline-none transition-all text-base h-20 resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Statut Paiement</label>
                          <select 
                            value={editingOrder.paymentStatus}
                            onChange={(e) => setEditingOrder({...editingOrder, paymentStatus: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-accent outline-none transition-all text-base bg-white"
                          >
                            <option value="unpaid">En attente</option>
                            <option value="paid">Payé</option>
                            <option value="cancelled">Annulé</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Statut Livraison</label>
                          <select 
                            value={editingOrder.status}
                            onChange={(e) => setEditingOrder({...editingOrder, status: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-accent outline-none transition-all text-base bg-white"
                          >
                            <option value="pending">En attente</option>
                            <option value="delivered">Livré</option>
                            <option value="cancelled">Annulé</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 border-t border-slate-100 flex gap-3">
                      <button 
                        onClick={() => setEditingOrder(null)}
                        className="flex-1 py-3.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all border border-slate-200"
                      >
                        Annuler
                      </button>
                      <button 
                        onClick={() => updateOrderFull(editingOrder.id, {
                          customerName: editingOrder.customerName,
                          customerPhone: editingOrder.customerPhone,
                          customerAddress: editingOrder.customerAddress,
                          paymentStatus: editingOrder.paymentStatus,
                          status: editingOrder.status
                        }).then(() => setEditingOrder(null))}
                        className="flex-1 py-3.5 rounded-xl font-bold bg-brand-accent text-brand-bg hover:bg-brand-accent-dark transition-all"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="font-bold text-slate-900">Gestion des avis</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Produit</th>
                    <th className="px-6 py-4">Note</th>
                    <th className="px-6 py-4">Commentaire</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reviews.length > 0 ? reviews.map((review, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-900">{review.name}</div>
                        <div className="text-[10px] text-slate-500">{review.location}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{review.productName}</td>
                      <td className="px-6 py-4">
                        <div className="flex text-brand-accent">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-500 max-w-xs truncate">{review.comment}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => deleteReview(review.id)}
                          className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                        Aucun avis trouvé dans la base de données.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


const ProductPage = ({ 
  addToCart, 
  openCODForm, 
  showToast,
  currentCountry,
  formatPrice,
  firestoreReviews
}: { 
  addToCart: (p: Product) => void, 
  openCODForm: (p: Product) => void, 
  showToast: (msg: string, type?: 'success' | 'error') => void,
  currentCountry: 'SN' | 'GN',
  formatPrice: (price: number) => string,
  firestoreReviews: any[]
}) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const product = PRODUCTS.find(p => p.slug === slug);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-bold mb-4">Produit non trouvé</h2>
        <button 
          onClick={() => navigate('/')}
          className="bg-brand-accent text-brand-bg px-6 py-2 rounded-full font-bold"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <ProductDetail 
      product={product}
      onClose={() => navigate(-1)}
      onAddToCart={addToCart}
      onBuyNow={(p) => openCODForm(p)}
      onShowToast={showToast}
      formatPrice={formatPrice}
      firestoreReviews={firestoreReviews}
    />
  );
};


export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const currentCountry = 'SN';
  const authInitiated = React.useRef(false);

  const formatPrice = (price: number) => {
    const config = COUNTRY_CONFIG[currentCountry];
    const convertedPrice = Math.round(price * config.exchangeRate);
    return `${convertedPrice.toLocaleString('de-DE')} FCFA`;
  };

  useEffect(() => {
    const trackVisit = async () => {
      const sessionTracked = sessionStorage.getItem('visit_tracked');
      if (sessionTracked) return;

      const today = new Date().toISOString().split('T')[0];
      const visitRef = doc(db, 'visits', today);
      try {
        await setDoc(visitRef, { 
          date: today, 
          count_SN: increment(1) 
        }, { merge: true });
        sessionStorage.setItem('visit_tracked', 'true');
      } catch (err) {
        console.error("Error tracking visit:", err);
      }
    };

    trackVisit();
  }, []);

  useEffect(() => {
    // Track Presence
    const trackPresence = () => {
      const sessionId = localStorage.getItem('session_id') || Math.random().toString(36).substring(7);
      localStorage.setItem('session_id', sessionId);
      const presenceRef = doc(db, 'presence', sessionId);
      
      const updatePresence = async () => {
        try {
          await setDoc(presenceRef, { 
            lastSeen: serverTimestamp() 
          }, { merge: true });
        } catch (err) {
          console.error("Error tracking presence:", err);
        }
      };

      updatePresence();
      const interval = setInterval(updatePresence, 60000); // Update every minute
      return () => clearInterval(interval);
    };

    trackPresence();
    const cleanupPresence = trackPresence();

    return () => {
      cleanupPresence();
    };
  }, []);
  useEffect(() => {
    // We use a ref to ensure this only runs once and avoid concurrent auth operations
    const checkAuthAndSignIn = async () => {
      if (authInitiated.current) return;
      authInitiated.current = true;
      
      // Wait a bit for the auth object to initialize from persistence
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          // Silently fail as we've made the rules more permissive for the PIN-based access
        }
      }
    };
    checkAuthAndSignIn();
  }, []);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [selectedProductForCOD, setSelectedProductForCOD] = useState<Product | null>(null);
  const [toast, setToast] = useState({ message: '', visible: false, type: 'success' as 'success' | 'error' });
  const [orderSuccess, setOrderSuccess] = useState({ isOpen: false, customerName: '', orderId: '' });
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [firestoreReviews, setFirestoreReviews] = useState<any[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const localizedBaseReviews = useMemo(() => {
    // Collect reviews from the REVIEWS constant
    const base: Review[] = [...REVIEWS];
    
    // Also collect reviews defined directly inside each product in the PRODUCTS array
    PRODUCTS.forEach(product => {
      const productReviews = product.reviews || [];
      productReviews.forEach(review => {
        base.push({
          ...review,
          productName: review.productName || product.name,
          productId: review.productId || product.id
        });
      });
    });

    return base;
  }, []);

  const allReviews = useMemo(() => {
    // 1. Group Firestore reviews by product (using name as fallback for legacy data)
    const userReviewsByProduct: Record<string, any[]> = {};
    firestoreReviews.forEach(r => {
      const key = r.productName;
      if (!userReviewsByProduct[key]) userReviewsByProduct[key] = [];
      userReviewsByProduct[key].push(r);
    });

    // 2. Group Base reviews by product
    const baseReviewsByProduct: Record<string, any[]> = {};
    localizedBaseReviews.forEach(r => {
      const key = r.productName;
      if (!baseReviewsByProduct[key]) baseReviewsByProduct[key] = [];
      baseReviewsByProduct[key].push(r);
    });

    // 3. Implement replacement logic: for each product, 
    // show all user reviews and skip the same number of default reviews.
    const finalReviews: any[] = [];
    
    // Get all unique product names
    const allProductNames = new Set([
      ...Object.keys(userReviewsByProduct), 
      ...Object.keys(baseReviewsByProduct)
    ]);

    allProductNames.forEach(name => {
      const uReviews = userReviewsByProduct[name] || [];
      const bReviews = baseReviewsByProduct[name] || [];
      
      // Always keep all user-added reviews
      finalReviews.push(...uReviews);
      
      // For default reviews, skip the number of user reviews we already added
      // This implements the "one user review replaces one default review" rule
      const remainingBase = bReviews.slice(uReviews.length);
      finalReviews.push(...remainingBase);
    });

    // 4. Finally apply deduplication
    const seen = new Set<string>();
    
    return finalReviews.filter(review => {
      // Normalize images
      const reviewImages = review.images || (review.image ? [review.image] : []);
      const normalizedImages = [...reviewImages]
        .map(url => url.trim().replace(/\s/g, ''))
        .filter(Boolean)
        .sort();
      const imageKey = normalizedImages.join('|');
      
      // Normalize comment for comparison
      const normalizedComment = (review.comment || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' '); // Normalize whitespace
      
      // Create a specific key to avoid accidental deduplication
      const key = `${review.productName}|${review.name}|${normalizedComment}|${imageKey}`;
      
      if (seen.has(key)) {
        return false;
      }
      
      seen.add(key);
      return true;
    });
  }, [firestoreReviews, localizedBaseReviews]);

  // Fetch reviews from Firestore
  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore timestamp to string if it exists
          date: data.createdAt instanceof Timestamp 
            ? `Le ${data.createdAt.toDate().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
            : data.date || "À l'instant"
        };
      });
      setFirestoreReviews(fetched);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'reviews');
    });
    return () => unsubscribe();
  }, []);

  const handleAddReview = async (newReview: any) => {
    try {
      await addDoc(collection(db, 'reviews'), {
        ...newReview,
        country: currentCountry,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'reviews');
    }
  };

  // Expose navigate to window for components that might need it outside of direct hook usage
  useEffect(() => {
    (window as any).navigation_hook_navigate = navigate;
  }, [navigate]);

  const handleLogoClick = () => {
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);
    if (newCount >= 5) {
      setIsPinModalOpen(true);
      setLogoClickCount(0);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, visible: true, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  useEffect(() => {
    const handleOrderSuccess = (e: any) => {
      setOrderSuccess({ 
        isOpen: true, 
        customerName: e.detail.customerName || '',
        orderId: e.detail.orderId || ''
      });
      setCart([]); // Empty cart on success
      
      // Track Purchase
      trackMetaEvent('Purchase', {
        value: e.detail.total || 0,
        currency: 'XOF',
        content_ids: [e.detail.orderId]
      });
    };
    window.addEventListener('order-success', handleOrderSuccess);
    return () => window.removeEventListener('order-success', handleOrderSuccess);
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(false); // Ensure it's not opened automatically
    showToast('Produit ajouté au panier');
    
    // Track AddToCart
    trackMetaEvent('AddToCart', {
      content_name: product.name,
      content_ids: [product.id.toString()],
      content_type: 'product',
      value: product.price,
      currency: 'XOF'
    });
  };

  const openCODForm = (product: Product) => {
    setSelectedProductForCOD(product);
    
    // Track InitiateCheckout
    trackMetaEvent('InitiateCheckout', {
      content_name: product.name,
      content_ids: [product.id.toString()],
      content_type: 'product',
      value: product.price,
      currency: 'XOF'
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  return (
    <div className="min-h-screen selection:bg-brand-accent selection:text-brand-bg overflow-x-hidden">
      <AnnouncementBar />
      <Navbar 
        cartCount={cartCount} 
        onOpenCart={() => setIsCartOpen(true)} 
        onOpenNav={() => setIsNavOpen(true)}
      />

      <main>
        <AnimatePresence mode="wait">
          <Routes location={location}>
            <Route path="/" element={
              <motion.div 
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Hero onExplore={() => {
                  navigate('/products');
                  window.scrollTo(0, 0);
                }} />
                
                {/* Categories */}
                <section className="py-12 md:py-20 overflow-hidden relative">
                  {/* Subtle Background Accent */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-brand-accent/5 blur-[120px] rounded-full pointer-events-none" />
                  
                  <div className="max-w-7xl mx-auto px-4 md:px-6 relative">
                    <div className="flex flex-nowrap md:flex-wrap items-center gap-6 md:gap-14 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-8 -mb-8 md:justify-center">
                      {CATEGORIES.map((cat, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1, duration: 0.5 }}
                          viewport={{ once: true }}
                          whileHover={{ y: -5 }}
                          onClick={() => {
                            navigate(`/products?filter=${cat.label.toLowerCase()}`);
                            window.scrollTo(0, 0);
                          }}
                          className="group flex flex-col items-center gap-4 cursor-pointer snap-center flex-shrink-0"
                        >
                          <div className="relative">
                            {/* Glow effect on hover */}
                            <div className="absolute inset-0 bg-brand-accent/0 rounded-full blur-2xl transition-all duration-500 group-hover:bg-brand-accent/20 group-hover:scale-150" />
                            
                            <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-brand-border/30 flex items-center justify-center transition-all duration-500 group-hover:shadow-[20px_20px_60px_#d1d1d1,-20px_-20px_60px_#ffffff] group-hover:border-brand-accent/40 z-10 overflow-hidden">
                               {/* Inner Gloss */}
                               <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                               
                               <img 
                                 src={cat.image} 
                                 alt={cat.label}
                                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                 referrerPolicy="no-referrer"
                               />
                            </div>
                            
                            {/* Active/Hover underline indicator */}
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brand-accent scale-0 transition-transform duration-300 group-hover:scale-100" />
                          </div>
                          
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="text-[10px] md:text-[11px] font-black tracking-[0.25em] text-brand-text-muted uppercase transition-colors duration-300 group-hover:text-brand-accent">
                              {cat.label}
                            </span>
                            <div className="h-0.5 w-0 bg-brand-accent transition-all duration-500 group-hover:w-full rounded-full opacity-40 shadow-[0_0_8px_rgba(39,172,255,0.6)]" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Products */}
                <section id="nos-produits" className="max-w-7xl mx-auto px-4 md:px-6 pt-12 pb-2 md:pt-16 md:pb-4">
                  <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-10 gap-4">
                    <div>
                      <h2 className="font-display text-3xl md:text-4xl font-extrabold leading-tight mb-2">
                        En vedettes <em className="not-italic">🔥</em>
                      </h2>
                      <button 
                        onClick={() => {
                          navigate('/products');
                          window.scrollTo(0, 0);
                        }}
                        className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-brand-text-muted hover:text-brand-accent transition-all"
                      >
                        Voir tout 
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                          <ChevronRight size={12} />
                        </div>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex overflow-x-auto pb-6 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide snap-x snap-mandatory">
                    {PRODUCTS.map(product => (
                      <div key={product.id} className="min-w-[280px] sm:min-w-[320px] md:min-w-0 snap-start">
                        <ProductCard 
                          product={product} 
                          onAddToCart={addToCart} 
                          onBuyNow={(p) => {
                            navigate(`/products/${p.slug}`);
                            window.scrollTo(0, 0);
                          }}
                          onShowToast={showToast}
                          formatPrice={formatPrice}
                        />
                      </div>
                    ))}
                  </div>
                </section>

                {/* Reviews Section */}
                <ReviewsSection 
                  reviews={allReviews}
                  onShowAllReviews={() => navigate('/reviews')} 
                  onProductClick={(productName) => {
                    const product = PRODUCTS.find(p => p.name === productName);
                    if (product) {
                      navigate(`/products/${product.slug}`);
                      window.scrollTo(0, 0);
                    }
                  }}
                />

                <FeaturesTabs />

                {/* Promo Banner */}
                <section id="qui-sommes-nous-?" className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
                  <div className="relative overflow-hidden rounded-3xl md:rounded-[40px] border border-brand-accent/20 group shadow-2xl transition-transform hover:scale-[1.01] duration-500">
                    <img 
                      src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiMzufbFqdEVfckipgYlHfr9TJm6_5OJTnu6NQ6a7ZXfeWLrh0cFFhIoWiPENdSJvExVkTNv05XiLdNjjQyLNqCnBPYNftLlBN-Iko5QQahMls7NL6nHL98P6Cjd1wV8WpcNbE66FuNOSMqpM0rEvsq9RbllKwjz1OhZ5OKTZp7VDMFEZPoB1cL3Bj4AiE/s800/LIVRAISON%20RAPIDE%20&%20FIABLE.png" 
                      alt="Livraison Rapide et Fiable" 
                      className="w-full h-auto block transform transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Compact Button Overlay */}
                    <div className="absolute inset-x-0 bottom-4 md:bottom-8 flex justify-center z-10">
                      <motion.button 
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          navigate('/products');
                          window.scrollTo(0, 0);
                        }}
                        className="bg-brand-accent text-brand-bg px-6 py-2.5 md:px-8 md:py-3.5 rounded-full font-bold text-[10px] md:text-xs uppercase tracking-widest shadow-2xl shadow-black/50 hover:bg-white hover:text-brand-accent transition-all border border-transparent hover:border-brand-accent/30"
                      >
                        Profiter de l'avantage
                        <ArrowRight size={14} className="inline ml-1.5 md:ml-2" />
                      </motion.button>
                    </div>
                  </div>
                </section>
              </motion.div>
            } />

            <Route path="/products" element={
              <ProductsPage 
                onBack={() => navigate('/')}
                onAddToCart={addToCart}
                onBuyNow={(p) => {
                  navigate(`/products/${p.slug}`);
                  window.scrollTo(0, 0);
                }}
                onShowDetail={(p) => navigate(`/products/${p.slug}`)}
                onShowToast={showToast}
                onProductClick={(productName) => {
                  const product = PRODUCTS.find(p => p.name === productName);
                  if (product) {
                    navigate(`/products/${product.slug}`);
                    window.scrollTo(0, 0);
                  }
                }}
                formatPrice={formatPrice}
              />
            } />

            <Route path="/collections" element={
              <CollectionsPage 
                onBack={() => navigate('/')}
                onCategoryClick={(category) => {
                  navigate(`/products?filter=${category}`);
                  window.scrollTo(0, 0);
                }}
              />
            } />

            <Route path="/products/:slug" element={
              <ProductPage 
                addToCart={addToCart}
                openCODForm={openCODForm}
                showToast={showToast}
                currentCountry={currentCountry}
                formatPrice={formatPrice}
                firestoreReviews={allReviews}
              />
            } />

            <Route path="/reviews" element={
              <ReviewsPage 
                reviews={allReviews}
                onBack={() => navigate('/')} 
                onWriteReview={() => setIsReviewModalOpen(true)}
                onProductClick={(productName) => {
                  const product = PRODUCTS.find(p => p.name === productName);
                  if (product) {
                    navigate(`/products/${product.slug}`);
                    window.scrollTo(0, 0);
                  }
                }}
              />
            } />

            <Route path="/contact" element={
              <ContactPage onBack={() => navigate('/')} />
            } />

            <Route path="/dashboard" element={
              <AdminDashboard 
                onBack={() => navigate('/')} 
                formatPrice={formatPrice}
                onShowToast={showToast}
              />
            } />
          </Routes>
        </AnimatePresence>
      </main>

      <footer className="bg-brand-surface border-t border-brand-border pt-12 md:pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-10 md:gap-12 mb-12">
          <div className="text-center sm:text-left">
            <img 
              src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEghnp-vjbnuQNUn5n8ElxyoWiUQGnYXlXqt9dEPNBOMuM716D1CRdlEMDGlt4iRhIOmRDWajOHolrpay_KLCZDx0izg2ypt-aDBQ3UEycricTkyeOarp2Cd8NwaF6ewQIVsw0NyPUiF18D0LoqE8_JwJesl-cSt6rl2iwZTDbqzG6xu20WxQpFc-oDXGuo/s800/Design_sans_titre-removebg-preview.webp" 
              alt="Vintech Afrik Logo" 
              className="h-12 md:h-14 w-auto object-contain mb-4 cursor-pointer mx-auto sm:mx-0"
              referrerPolicy="no-referrer"
              onClick={handleLogoClick}
            />
            <p className="text-[12px] md:text-[13px] text-brand-text-muted leading-relaxed mb-6 max-w-[280px] mx-auto sm:mx-0">
              « Le soin de soi n'est pas un luxe, c'est une base et le bien-être commence par l'écoute de soi ! » 😊
            </p>
            <a href="tel:+221768830695" className="inline-flex items-center gap-2 text-[12px] md:text-[13px] font-semibold text-brand-accent border border-brand-accent/30 px-4 py-2 rounded-sm hover:bg-brand-accent/10 transition-all">
              📲 +221 76 883 06 95
            </a>
          </div>
          
          <div className="text-left">
            <h4 className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-black mb-4 md:mb-6">Navigation</h4>
            <ul className="space-y-2.5 md:space-y-3">
              {[
                { label: 'Accueil', path: '/' },
                { label: 'Nos produits', path: '/products' },
                { label: 'Nos collections', path: '/collections' },
                { label: 'Avis clients', path: '/reviews' },
                { label: 'Contact', path: '/contact' }
              ].map(item => (
                <li key={item.label}>
                  <button 
                    onClick={() => {
                      navigate(item.path);
                      window.scrollTo(0, 0);
                    }}
                    className="text-[12px] md:text-[13px] text-black hover:text-brand-accent transition-colors text-left w-full sm:w-auto"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-left">
            <h4 className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-black mb-4 md:mb-6">Suivez-nous</h4>
            <div className="flex gap-4 justify-start">
              <a 
                href="https://www.tiktok.com/@vintech_afrik?is_from_webapp=1&sender_device=pc" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-brand-surface-alt border border-brand-border flex items-center justify-center text-brand-text-muted hover:text-brand-accent hover:border-brand-accent transition-all"
              >
                <svg 
                  viewBox="0 0 24 24" 
                  width="18" 
                  height="18" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                </svg>
              </a>
              <a 
                href="https://www.instagram.com/vintech_afrik/?utm_source=ig_web_button_share_sheet" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-brand-surface-alt border border-brand-border flex items-center justify-center text-brand-text-muted hover:text-brand-accent hover:border-brand-accent transition-all"
              >
                <Instagram size={18} />
              </a>
              <a 
                href="https://www.facebook.com/share/17axqGhxkr/?mibextid=wwXIfr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-brand-surface-alt border border-brand-border flex items-center justify-center text-brand-text-muted hover:text-brand-accent hover:border-brand-accent transition-all"
              >
                <Facebook size={18} />
              </a>
            </div>
          </div>
        </div>
      </footer>

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={cart} 
        onRemove={removeFromCart}
        onShowToast={showToast}
        formatPrice={formatPrice}
      />

      <CODModal 
        isOpen={!!selectedProductForCOD} 
        onClose={() => setSelectedProductForCOD(null)} 
        product={selectedProductForCOD}
        onShowToast={showToast}
        formatPrice={formatPrice}
      />

      <NavDrawer
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
      />

      <RecentPurchaseNotification />
      
      <OrderSuccessModal 
        isOpen={orderSuccess.isOpen} 
        onClose={() => setOrderSuccess({ ...orderSuccess, isOpen: false })} 
        customerName={orderSuccess.customerName}
        orderId={orderSuccess.orderId}
      />

      <PinModal 
        isOpen={isPinModalOpen} 
        onClose={() => setIsPinModalOpen(false)} 
        onSuccess={() => {
          sessionStorage.setItem('admin_pin_verified', 'true');
          navigate('/dashboard');
        }}
        onShowToast={showToast}
      />

      <ReviewModal 
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onAddReview={handleAddReview}
        products={PRODUCTS}
      />
      
      <Toast message={toast.message} isVisible={toast.visible} type={toast.type} />
    </div>
  );
}
