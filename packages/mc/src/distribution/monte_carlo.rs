use wasm_bindgen::prelude::*;
use rand::Rng;
use rand::thread_rng;
use kernel_density::kde;
use serde::Serialize;
use crate::distribution::bandwidth::{nrd0, nrd};

// TODO: impl a constructor such that xs.len() == ys.len().
#[wasm_bindgen]
#[derive(Serialize)]
pub struct PdfCurve {
    xs: Vec<f64>,
    ys: Vec<f64>,
}

pub fn samples_to_continuous_pdf(samples: Vec<f64>, bandwidth: f64) -> JsValue {
    let samples_to_map = samples.clone();
    let pdf = kde::normal(&samples, bandwidth);
    let pdf_curve = PdfCurve {
        xs: samples,
        ys: samples_to_map.iter().map(|x| pdf.density(*x)).collect(),
    };
    JsValue::from_serde::<PdfCurve>(&pdf_curve).unwrap()
}

// pub fn get_curve(samples: Vec<f64>, n: u64) -> Vec<f64> {
//     let bandwidth = nrd(&samples);
//     let curve = samples_to_continuous_pdf(samples, bandwidth);
//     return curve.ys;
// }


pub fn sample_n(xs: Vec<f32>, n: i32) -> Vec<f32> {
    let m = xs.len();
    let mut output = vec![];
    for _ in 0..n {
        output.push(xs[thread_rng().gen_range(0..m)])
    }
    return output;
}
